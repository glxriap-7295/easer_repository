import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { listTeam, saveTeamMember } from "@/lib/store";
import { ok, fail, newId } from "@/lib/api";
import type { TeamMember } from "@/lib/types";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try { await requireRole(req, "admin"); } catch (e: any) { return fail(e.message, e.status || 403); }
  return ok(await listTeam());
}
export async function POST(req: NextRequest) {
  try { await requireRole(req, "admin"); } catch (e: any) { return fail(e.message, e.status || 403); }
  const b = await req.json().catch(() => null);
  if (!b?.name) return fail("Name is required", 422);
  const now = new Date().toISOString();
  const m: TeamMember = {
    id: newId("tm"), name: b.name, group: b.group || "team", role: b.role || "",
    institution: b.institution || undefined, photoURL: b.photoURL || undefined,
    linkedin: b.linkedin || undefined, bio: b.bio || undefined,
    order: typeof b.order === "number" ? b.order : 100, featured: !!b.featured,
    createdAt: now, updatedAt: now
  };
  await saveTeamMember(m);
  return ok(m, { status: 201 });
}
