import { NextRequest } from "next/server";
import { resolveUser } from "@/lib/auth";
import { getUserDoc, updateUserProfile } from "@/lib/users";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await resolveUser(req);
  if (!user) return fail("Unauthorized", 401);
  const profile = (await getUserDoc(user.uid)) || {
    uid: user.uid, email: user.email, displayName: user.email.split("@")[0],
    role: user.role, active: true, createdAt: "", updatedAt: ""
  };
  return ok(profile);
}

export async function PATCH(req: NextRequest) {
  const user = await resolveUser(req);
  if (!user) return fail("Unauthorized", 401);
  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid JSON");
  const allowed = {
    displayName: typeof body.displayName === "string" ? body.displayName : undefined,
    institution: typeof body.institution === "string" ? body.institution : undefined,
    orcid: typeof body.orcid === "string" ? body.orcid : undefined,
    photoURL: typeof body.photoURL === "string" ? body.photoURL : undefined
  };
  const updated = await updateUserProfile(user.uid, allowed);
  if (!updated) return fail("Profile not found", 404);
  return ok(updated);
}
