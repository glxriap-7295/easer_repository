import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { getTeamMember, saveTeamMember, deleteTeamMember } from "@/lib/store";
import { ok, fail } from "@/lib/api";
export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireRole(req, "admin"); } catch (e: any) { return fail(e.message, e.status || 403); }
  const existing = await getTeamMember(params.id);
  if (!existing) return fail("Not found", 404);
  const b = await req.json().catch(() => ({}));
  const fields = ["name", "group", "role", "institution", "photoURL", "linkedin", "bio", "order", "featured"] as const;
  const patch: any = {};
  for (const k of fields) if (k in b) patch[k] = b[k];
  await saveTeamMember({ ...existing, ...patch, updatedAt: new Date().toISOString() });
  return ok(await getTeamMember(params.id));
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireRole(req, "admin"); } catch (e: any) { return fail(e.message, e.status || 403); }
  await deleteTeamMember(params.id);
  return ok({ deleted: true });
}
