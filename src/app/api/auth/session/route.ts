import { NextRequest } from "next/server";
import { getAdminApp } from "@/lib/firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { SESSION_COOKIE } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

const EXPIRES_MS = 14 * 24 * 60 * 60 * 1000; // 14 days ("stay logged in")

// Mint an httpOnly session cookie from a freshly-refreshed ID token so that
// server components/layouts can verify auth + role without client JS.
export async function POST(req: NextRequest) {
  const app = getAdminApp();
  if (!app) return fail("Auth backend not configured", 503);
  const body = await req.json().catch(() => null);
  const idToken = body?.idToken;
  if (!idToken) return fail("Missing idToken", 400);
  try {
    await getAuth(app).verifyIdToken(idToken, true);
    const cookie = await getAuth(app).createSessionCookie(idToken, { expiresIn: EXPIRES_MS });
    const res = ok({ ok: true });
    res.cookies.set(SESSION_COOKIE, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: EXPIRES_MS / 1000
    });
    return res;
  } catch (e: any) {
    return fail(`Could not create session: ${e.message || e}`, 401);
  }
}

// Logout — clear the session cookie.
export async function DELETE() {
  const res = ok({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
