import { NextRequest } from "next/server";
import { getContribution, updateContribution, upsertRegistry } from "@/lib/store";
import { requireAdmin } from "@/lib/auth";
import { publishFiles, githubConfigured, repoInfo, type CommitFile } from "@/lib/github/service";
import { getStorageProvider } from "@/lib/storage";
import { notify } from "@/lib/email";
import { ok, fail } from "@/lib/api";
import type { RegistryRecord } from "@/lib/types";

export const runtime = "nodejs";

// Admin approval — the only path by which content enters GitHub. Nothing is
// committed automatically; this runs in response to an explicit admin action.
const MAX_INLINE_BYTES = 5 * 1024 * 1024; // don't push very large blobs to git

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireAdmin(req);
  } catch (e: any) {
    return fail(e.message, e.status || 403);
  }

  const c = await getContribution(params.id);
  if (!c) return fail("Not found", 404);
  if (!c.draft) return fail("Generate the documentation draft before approving", 409);
  if (!c.repoPath) return fail("Missing repository path", 409);

  if (!githubConfigured()) {
    return fail(
      "GitHub is not configured. Set GITHUB_TOKEN to enable publishing. " +
        "The contribution can still be marked approved, but no commit will be created.",
      503
    );
  }

  // Assemble files: README.md (always) plus small attachments fetched from storage.
  const files: CommitFile[] = [
    { path: `${c.repoPath}/README.md`, content: c.draft.markdown, encoding: "utf-8" }
  ];

  const storage = getStorageProvider();
  for (const f of c.files) {
    if (f.size > MAX_INLINE_BYTES) continue; // large files stay in external storage
    try {
      const buf = await storage.get(f.storageKey);
      files.push({ path: `${c.repoPath}/${f.name}`, content: buf.toString("base64"), encoding: "base64" });
    } catch (err) {
      console.warn(`[approve] could not fetch ${f.storageKey}; skipping`, err);
    }
  }

  const message = `Add contribution: ${c.metadata.title}`;
  const prBody = `**Contributor:** ${c.submitter.name} (${c.submitter.affiliation})\n\n${c.metadata.description}\n\n_Submitted via the EASER Research Data Hub and approved by ${user.email}._`;

  let result;
  try {
    result = await publishFiles(files, message, { prBody });
  } catch (err: any) {
    console.error("[approve] publish failed:", err);
    return fail(`GitHub publish failed: ${err.message || err}`, 502);
  }

  const status = result.strategy === "pull_request" ? "approved" : "published";
  const updated = await updateContribution(
    params.id,
    {
      status,
      githubCommitUrl: result.url,
      githubPrNumber: result.prNumber,
      repoPath: c.repoPath
    },
    { at: new Date().toISOString(), actor: user.email, action: status, note: result.url }
  );

  const reg: RegistryRecord = {
    id: c.id,
    title: c.metadata.title,
    category: c.metadata.category,
    author: c.submitter.name,
    affiliation: c.submitter.affiliation,
    description: c.metadata.description,
    keywords: c.metadata.keywords,
    repoPath: c.repoPath,
    githubUrl: result.url,
    approvedAt: new Date().toISOString()
  };
  await upsertRegistry(reg);

  await notify({
    to: c.submitter.email,
    subject: `[EASER] Your contribution "${c.metadata.title}" was approved`,
    text:
      result.strategy === "pull_request"
        ? `Your contribution has been approved and a pull request was opened in ${repoInfo.owner}/${repoInfo.repo}:\n${result.url}`
        : `Your contribution has been published to ${repoInfo.owner}/${repoInfo.repo}:\n${result.url}`
  });

  return ok(updated);
}
