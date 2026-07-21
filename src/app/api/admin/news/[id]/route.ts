import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { getNews, saveNews, deleteNews } from "@/lib/store";
import { ok, fail } from "@/lib/api";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireRole(req, "admin"); } catch (e: any) { return fail(e.message, e.status || 403); }
  const existing = await getNews(params.id);
  if (!existing) return fail("Not found", 404);
  const b = await req.json().catch(() => ({}));
  const fields = ["title", "subtitle", "coverImage", "content", "authorName", "authorId", "tags", "pinned", "externalLinks", "status", "publishedAt",
    "kind", "eventType", "startDate", "startTime", "endDate", "endTime", "location", "registrationUrl"] as const;
  const patch: any = {};
  for (const k of fields) if (k in b) patch[k] = b[k];
  // set publishedAt when transitioning to published without a date
  if (patch.status === "published" && !existing.publishedAt && !patch.publishedAt) patch.publishedAt = new Date().toISOString();
  await saveNews({ ...existing, ...patch, updatedAt: new Date().toISOString() });
  return ok(await getNews(params.id));
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireRole(req, "admin"); } catch (e: any) { return fail(e.message, e.status || 403); }
  await deleteNews(params.id);
  return ok({ deleted: true });
}
