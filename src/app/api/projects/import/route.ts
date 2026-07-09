import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { createProject, upsertRegistry } from "@/lib/store";
import { parseRepoUrl, readRepo, githubConfigured } from "@/lib/github/service";
import { buildSummary } from "@/lib/docgen/generator";
import { slugify, inferFileCategory } from "@/lib/constants";
import { ok, fail, newId } from "@/lib/api";
import type { Project, UploadedFile } from "@/lib/types";

export const runtime = "nodejs";

// Import an EXISTING GitHub repository as an EASER project WITHOUT modifying the
// source. Preserves structure, links files to the source, generates a Scientific
// Overview, and creates a public project page. The source repo becomes this
// project's canonical repository (repo.strategy = "repo", importedFrom = url).
export async function POST(req: NextRequest) {
  let user;
  try { user = await requireRole(req, "researcher"); }
  catch (e: any) { return fail(e.message, e.status || 401); }
  if (!githubConfigured()) return fail("GitHub is not configured (set GITHUB_TOKEN).", 503);

  const body = await req.json().catch(() => null);
  const parsed = body?.url ? parseRepoUrl(body.url) : null;
  if (!parsed) return fail("Provide a valid GitHub repository URL", 422);

  let repo;
  try { repo = await readRepo(parsed.owner, parsed.name); }
  catch (e: any) { return fail(`Could not read repository: ${e.message || e}`, 502); }

  const title = (body.title || repo.name).toString();
  const slug = slugify(title);
  const now = new Date().toISOString();

  // Preserve structure: each blob → a file linked to the source (raw URL).
  const files: UploadedFile[] = repo.tree
    .filter((t) => t.type === "blob" && t.path && !/^\./.test(t.path))
    .map((t) => {
      const parts = t.path.split("/");
      const folder = parts.length > 1 ? parts[0] : "";
      const name = parts[parts.length - 1];
      return {
        name, size: t.size || 0, contentType: "application/octet-stream",
        storageKey: "", // external; not in our storage
        url: `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${repo.defaultBranch}/${encodeURI(t.path)}`,
        category: inferFileCategory(name, folder),
        folder: folder || undefined
      };
    });

  const project: Project = {
    id: newId("p"),
    status: "published",
    ownerUid: user.uid,
    title,
    projectType: (body.projectType as any) || "research",
    description: repo.description || `Imported from ${repo.url}`,
    purpose: "",
    authors: [{ name: user.email.split("@")[0] }],
    institutions: [],
    contactName: user.email.split("@")[0],
    contactEmail: user.email,
    keywords: [],
    files,
    slug,
    repoPath: "",
    repo: { strategy: "repo", owner: repo.owner, name: repo.name, url: repo.url, defaultBranch: repo.defaultBranch, importedFrom: body.url },
    readme: repo.readme || `# ${title}\n\nImported from ${repo.url}.`,
    githubCommitUrl: repo.url,
    version: 1,
    publishedAt: now,
    audit: [{ at: now, actor: user.email, action: "imported", note: repo.url }],
    createdAt: now,
    updatedAt: now
  };
  // Generate the Scientific Overview from the imported contents (template; safe).
  project.summary = buildSummary(project);

  await createProject(project);
  await upsertRegistry({
    id: project.id, title, category: "report",
    author: project.authors[0].name, affiliation: "",
    authors: project.authors.map((a) => a.name), institutions: [],
    year: new Date(now).getFullYear(), description: project.description, keywords: [],
    repoPath: "", githubUrl: repo.url, approvedAt: now, source: "project"
  });

  return ok({ id: project.id, title, fileCount: files.length, repo: repo.url }, { status: 201 });
}
