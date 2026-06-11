import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { setUserRole, setUserActive, getUserDoc } from "@/lib/users";
import { isAdminEmail } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

// Admin-only: change a user's role or active state. Guards against self-lockout
// and against demoting a bootstrap (allowlisted) administrator.
export async function PATCH(req: NextRequest, { params }: { params: { uid: string } }) {
  let admin;
  try { admin = await requireRole(req, "admin"); }
  catch (e: any) { return fail(e.message, e.status || 403); }

  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid JSON");
  if (params.uid === admin.uid) return fail("You cannot change your own role or status.", 400);

  const target = await getUserDoc(params.uid);
  if (!target) return fail("User not found", 404);

  if (typeof body.role === "string") {
    if (!ROLES.includes(body.role)) return fail("Invalid role", 422);
    if (isAdminEmail(target.email) && body.role !== "admin")
      return fail("This account is a permanent administrator (email allowlist).", 400);
    await setUserRole(params.uid, body.role);
  }
  if (typeof body.active === "boolean") {
    if (isAdminEmail(target.email) && body.active === false)
      return fail("Cannot deactivate a permanent administrator.", 400);
    await setUserActive(params.uid, body.active);
  }
  return ok(await getUserDoc(params.uid));
}
