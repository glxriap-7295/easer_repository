import { NextRequest } from "next/server";
import { getFile, githubConfigured } from "@/lib/github/service";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

// Public: fetch a single text file's content for the in-browser viewer.
export async function GET(req: NextRequest) {
  if (!githubConfigured()) return fail("GitHub not configured (set GITHUB_TOKEN)", 503);
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return fail("Missing ?path");
  try {
    const file = await getFile(path);
    return ok({ path, ...file });
  } catch (e: any) {
    return fail(e.message || "Failed to read file", 502);
  }
}
