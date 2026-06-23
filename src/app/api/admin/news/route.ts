import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { listNews, saveNews } from "@/lib/store";
import { ok, fail, newId } from "@/lib/api";
import { slugify } from "@/lib/constants";
import type { NewsPost } from "@/lib/types";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try { await requireRole(req, "admin"); } catch (e: any) { return fail(e.message, e.status || 403); }
  return ok(await listNews());
}
export async function POST(req: NextRequest) {
  let user;
  try { user = await requireRole(req, "admin"); } catch (e: any) { return fail(e.message, e.status || 403); }
  const b = await req.json().catch(() => null);
  if (!b?.title) return fail("Title is required", 422);
  const now = new Date().toISOString();
  const status = b.status === "published" ? "published" : "draft";
  const n: NewsPost = {
    id: newId("nw"),
    slug: (b.slug ? slugify(b.slug) : slugify(b.title)) + "-" + Math.random().toString(36).slice(2, 6),
    title: b.title, subtitle: b.subtitle || undefined, coverImage: b.coverImage || undefined,
    content: b.content || "", authorName: b.authorName || user.email, authorId: b.authorId || undefined,
    tags: Array.isArray(b.tags) ? b.tags : [], status, pinned: !!b.pinned,
    externalLinks: Array.isArray(b.externalLinks) ? b.externalLinks : undefined,
    publishedAt: status === "published" ? (b.publishedAt || now) : undefined,
    createdAt: now, updatedAt: now
  };
  await saveNews(n);
  return ok(n, { status: 201 });
}
