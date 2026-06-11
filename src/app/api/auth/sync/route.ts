import { NextRequest } from "next/server";
import { getAdminApp } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { ensureUserDoc } from "@/lib/users";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

// Called by the client right after sign-in. Ensures the Firestore user doc
// exists, bootstraps the admin role for allowlisted emails, and returns the
// profile. The client then refreshes its ID token to pick up custom claims.
export async function POST(req: NextRequest) {
  const app = getAdminApp();
  if (!app) return fail("Auth backend not configured", 503);
  const authz = req.headers.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) return fail("Missing bearer token", 401);
  try {
    const decoded = await getAuth(app).verifyIdToken(token);
    const profile = await ensureUserDoc({
      uid: decoded.uid,
      email: decoded.email || "",
      displayName: (decoded.name as string) || undefined
    });
    return ok(profile);
  } catch (e: any) {
    return fail(`Token verification failed: ${e.message || e}`, 401);
  }
}
