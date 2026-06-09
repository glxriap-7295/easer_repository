import { NextRequest } from "next/server";
import { listFullTree, githubConfigured } from "@/lib/github/service";
import { listRegistry } from "@/lib/store";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const revalidate = 120;

// Search across the repository file tree (by path) AND the approved registry
// (by title/keywords/author). Lightweight client-facing search; for large repos
// this can later be backed by an index.
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  if (!q) return ok({ q, files: [], registry: [] });

  const registry = (await listRegistry()).filter((r) =>
    [r.title, r.description, r.author, ...(r.keywords || [])]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );

  let files: { path: string; type: string }[] = [];
  if (githubConfigured()) {
    try {
      const tree = await listFullTree();
      files = tree
        .filter((t) => t.type === "blob" && t.path.toLowerCase().includes(q))
        .slice(0, 100)
        .map((t) => ({ path: t.path, type: t.type }));
    } catch (e) {
      // tolerate GitHub errors — still return registry results
    }
  }

  return ok({ q, files, registry });
}
