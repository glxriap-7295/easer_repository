import { NextRequest } from "next/server";
import { getNewsBySlug } from "@/lib/store";
import { ok, fail } from "@/lib/api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always read fresh data (no build-time caching)
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const n = await getNewsBySlug(params.slug);
  if (!n || n.status !== "published") return fail("Not found", 404);
  return ok(n);
}
