import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { parseRepoUrl, readRepo, githubConfigured } from "@/lib/github/service";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

// Read-only analysis of an external repository for the import review step.
// Never modifies the source.
export async function POST(req: NextRequest) {
  try { await requireRole(req, "researcher"); }
  catch (e: any) { return fail(e.message, e.status || 401); }
  if (!githubConfigured()) return fail("GitHub is not configured (set GITHUB_TOKEN).", 503);

  const body = await req.json().catch(() => null);
  const parsed = body?.url ? parseRepoUrl(body.url) : null;
  if (!parsed) return fail("Provide a valid GitHub repository URL", 422);

  let repo;
  try { repo = await readRepo(parsed.owner, parsed.name); }
  catch (e: any) { return fail(`Could not read repository: ${e.message || e}`, 502); }

  const blobs = repo.tree.filter((t) => t.type === "blob" && !/^\./.test(t.path));
  const folders = new Set<string>();
  blobs.forEach((b) => { const parts = b.path.split("/"); if (parts.length > 1) folders.add(parts[0]); });
  const topLevel = repo.tree.filter((t) => !t.path.includes("/")).map((t) => ({ path: t.path, type: t.type }));

  return ok({
    owner: repo.owner, name: repo.name, url: repo.url, description: repo.description,
    defaultBranch: repo.defaultBranch,
    sizeKb: repo.sizeKb, license: repo.license, language: repo.language, pushedAt: repo.pushedAt,
    fileCount: blobs.length, folderCount: folders.size,
    readmePreview: repo.readme.slice(0, 1200),
    topLevel
  });
}
