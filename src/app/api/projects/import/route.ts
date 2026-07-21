import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { createProject } from "@/lib/store";
import { parseRepoUrl, readRepo, githubConfigured } from "@/lib/github/service";
import { buildSummary } from "@/lib/docgen/generator";
import { slugify, inferFileCategory } from "@/lib/constants";
import { ok, fail, newId } from "@/lib/api";
import type { Project, UploadedFile } from "@/lib/types";

export const runtime = "nodejs";

// Import an EXISTING GitHub repository as an EASER project WITHOUT modifying the
// source. Preserves structure, links files to the source, and generates an
// initial Scientific Overview. The result is a **DRAFT** — it is NOT published.
// The researcher reviews/edits it and submits it through the normal review
// pipeline; nothing becomes public until an admin approves it. The source repo
// becomes this project's canonical repository (repo.strategy = "repo").
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
    status: "draft", // imported repos start as editable drafts — NEVER auto-published
    ownerUid: user.uid,
    title,
    projectType: (body.projectType as any) || "research",
    description: repo.description || `Imported from ${repo.url}`,
    purpose: "",
    authors: [{ name: user.email.split("@")[0], email: user.email }],
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
    version: 0, // not published yet
    audit: [{ at: now, actor: user.email, action: "imported", note: `draft from ${repo.url}` }],
    createdAt: now,
    updatedAt: now
  };
  // Initial Scientific Overview draft from the imported contents (template; safe,
  // no hallucination). The researcher can edit it before submitting for review.
  project.summary = buildSummary(project);
  project.summaryEdited = false;

  await createProject(project);

  // NOTE: no registry upsert and no publish here — the project only becomes
  // public after it is submitted and an admin approves it (same as manual repos).
  return ok({ id: project.id, title, status: project.status, fileCount: files.length, repo: repo.url }, { status: 201 });
}
