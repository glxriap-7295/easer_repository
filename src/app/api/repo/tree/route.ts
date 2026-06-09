import { NextRequest } from "next/server";
import { listTree, githubConfigured } from "@/lib/github/service";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const revalidate = 60;

// Public: browse one level of the repository.
export async function GET(req: NextRequest) {
  if (!githubConfigured()) return fail("GitHub not configured (set GITHUB_TOKEN)", 503);
  const path = req.nextUrl.searchParams.get("path") || "";
  try {
    const nodes = await listTree(path);
    return ok({ path, nodes });
  } catch (e: any) {
    return fail(e.message || "Failed to read repository", 502);
  }
}
