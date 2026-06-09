import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { getProject, updateProject, upsertRegistry } from "@/lib/store";
import { buildProjectReadme, buildProjectMetadata } from "@/lib/docgen/project";
import { publishFiles, githubConfigured, repoInfo, type CommitFile } from "@/lib/github/service";
import { getStorageProvider } from "@/lib/storage";
import { notify } from "@/lib/email";
import { ok, fail } from "@/lib/api";
import { CONTRIB_ROOT, slugify, contributionFileName } from "@/lib/constants";
import type { RegistryRecord } from "@/lib/types";

export const runtime = "nodejs";
const MAX_INLINE_BYTES = 5 * 1024 * 1024;

// The ONLY path content enters GitHub. Project-primary layout:
//   <CONTRIB_ROOT>/<slug>/{ metadata.json, README.md, <renamed files> }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let user;
  try { user = await requireRole(req, "curator"); }
  catch (e: any) { return fail(e.message, e.status || 403); }

  const p = await getProject(params.id);
  if (!p) return fail("Not found", 404);
  if (!["submitted", "under_review", "approved"].includes(p.status))
    return fail(`Cannot approve a project with status "${p.status}"`, 409);
  if (!githubConfigured())
    return fail("GitHub is not configured (set GITHUB_TOKEN). Cannot publish.", 503);

  const slug = p.slug || slugify(p.title);
  const repoPath = `${CONTRIB_ROOT}/${slug}`;
  const primaryAuthor = p.authors[0]?.name || p.contactName || "anon";

  // Resolve published filenames and fetch file bytes from storage.
  const storage = getStorageProvider();
  const commitFiles: CommitFile[] = [];
  const publishedNames: string[] = [];
  for (const f of p.files) {
    const name = contributionFileName(slug, primaryAuthor, f.name);
    publishedNames.push(name);
    if (f.size > MAX_INLINE_BYTES) continue; // large files stay in external storage
    try {
      const buf = await storage.get(f.storageKey);
      commitFiles.push({ path: `${repoPath}/${name}`, content: buf.toString("base64"), encoding: "base64" });
    } catch (err) {
      console.warn(`[project approve] could not fetch ${f.storageKey}; linking instead`, err);
    }
  }

  const readme = p.draft?.markdown || buildProjectReadme({ ...p, slug }, publishedNames);
  const metadata = buildProjectMetadata({ ...p, slug, repoPath }, publishedNames);
  const files: CommitFile[] = [
    { path: `${repoPath}/README.md`, content: readme, encoding: "utf-8" },
    { path: `${repoPath}/metadata.json`, content: JSON.stringify(metadata, null, 2), encoding: "utf-8" },
    ...commitFiles
  ];

  const message = `Add project: ${p.title}`;
  const prBody = `**Project:** ${p.title}\n**Authors:** ${p.authors.map((a) => a.name).join(", ")}\n**Institutions:** ${p.institutions.map((i) => i.name).join(", ")}\n\n${p.description}\n\n_Submitted via the EASER Research Data Hub; approved by ${user.email}._`;

  let result;
  try {
    result = await publishFiles(files, message, { prBody, branchName: `project/${slug}-${Date.now().toString(36)}` });
  } catch (e: any) {
    return fail(`GitHub publish failed: ${e.message || e}`, 502);
  }

  const now = new Date().toISOString();
  const status = result.strategy === "pull_request" ? "approved" : "published";
  const updated = await updateProject(params.id,
    { status, repoPath, slug, githubCommitUrl: result.url, githubPrNumber: result.prNumber, publishedAt: now },
    { at: now, actor: user.email, action: status, note: result.url });

  const year = new Date(p.submittedAt || p.createdAt || now).getFullYear();
  const reg: RegistryRecord = {
    id: p.id,
    title: p.title,
    category: p.category,
    author: primaryAuthor,
    affiliation: p.institutions[0]?.name || "",
    authors: p.authors.map((a) => a.name),
    institutions: p.institutions.map((i) => i.name),
    year,
    description: p.description,
    keywords: p.keywords,
    repoPath,
    githubUrl: result.url,
    approvedAt: now,
    source: "project"
  };
  await upsertRegistry(reg);

  await notify({
    to: p.contactEmail,
    subject: `[EASER] "${p.title}" ${status === "published" ? "published" : "approved"}`,
    text: result.strategy === "pull_request"
      ? `Your project "${p.title}" was approved and a pull request was opened in ${repoInfo.owner}/${repoInfo.repo}:\n${result.url}`
      : `Your project "${p.title}" has been published to ${repoInfo.owner}/${repoInfo.repo}:\n${result.url}`
  });
  return ok(updated);
}
