import "server-only";
import { getAdminApp } from "./firebase/admin";
import { getAuth } from "firebase-admin/auth";

const adminEmails = (process.env.ADMIN_EMAILS || "easer.data@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email?: string | null): boolean {
  return !!email && adminEmails.includes(email.toLowerCase());
}

export interface AuthedUser {
  uid: string;
  email: string;
  isAdmin: boolean;
}

/**
 * Verify the Firebase ID token from the Authorization header.
 * In dev mode without Admin credentials, an `x-easer-dev-admin: true` header
 * grants admin so the dashboard is demonstrable. This bypass is disabled in
 * production (NODE_ENV === "production").
 */
export async function getAuthedUser(req: Request): Promise<AuthedUser | null> {
  const app = getAdminApp();
  const authz = req.headers.get("authorization") || "";
  const token = authz.startsWith("Bearer ") ? authz.slice(7) : null;

  if (app && token) {
    try {
      const decoded = await getAuth(app).verifyIdToken(token);
      const email = decoded.email || "";
      return { uid: decoded.uid, email, isAdmin: isAdminEmail(email) || decoded.admin === true };
    } catch {
      return null;
    }
  }

  // Dev/demo bypass.
  if (process.env.NODE_ENV !== "production" && req.headers.get("x-easer-dev-admin") === "true") {
    return { uid: "dev-admin", email: adminEmails[0] || "dev@easer.local", isAdmin: true };
  }
  return null;
}

export async function requireAdmin(req: Request): Promise<AuthedUser> {
  const user = await getAuthedUser(req);
  if (!user || !user.isAdmin) {
    const err: any = new Error("Forbidden: admin access required");
    err.status = 403;
    throw err;
  }
  return user;
}
