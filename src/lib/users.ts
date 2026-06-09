import "server-only";
import { getAdminApp, getAdminDb } from "./firebase/admin";
import { getAuth } from "firebase-admin/auth";
import { bootstrapRole } from "./auth";
import type { Role, UserProfile } from "./roles";

// Firestore document describing a platform user. Auth lives in Firebase Auth;
// this mirrors profile + role for queries and admin management (Phase 7).

const COL = "users";

export async function getUserDoc(uid: string): Promise<UserProfile | null> {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection(COL).doc(uid).get();
  return snap.exists ? (snap.data() as UserProfile) : null;
}

/** Push the user's role onto their Firebase custom claims (authoritative). */
async function syncClaims(uid: string, role: Role): Promise<void> {
  const app = getAdminApp();
  if (!app) return;
  await getAuth(app).setCustomUserClaims(uid, { role, admin: role === "admin" });
}

/**
 * Ensure a user document exists. Called on first sign-in. New users are
 * assigned a bootstrap role (admin if their email is allowlisted, else
 * researcher) and the matching custom claims are set.
 */
export async function ensureUserDoc(params: {
  uid: string;
  email: string;
  displayName?: string;
}): Promise<UserProfile> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const existing = await getUserDoc(params.uid);

  if (existing) {
    // Keep admin allowlist authoritative even for pre-existing accounts.
    const desired = bootstrapRole(params.email);
    if (desired === "admin" && existing.role !== "admin") {
      await setUserRole(params.uid, "admin");
      return { ...existing, role: "admin", updatedAt: now };
    }
    await syncClaims(params.uid, existing.role); // re-assert claims each login
    return existing;
  }

  const role = bootstrapRole(params.email);
  const profile: UserProfile = {
    uid: params.uid,
    email: params.email,
    displayName: params.displayName || params.email.split("@")[0],
    role,
    active: true,
    createdAt: now,
    updatedAt: now
  };
  if (db) await db.collection(COL).doc(params.uid).set(profile);
  await syncClaims(params.uid, role);
  return profile;
}

export async function updateUserProfile(
  uid: string,
  patch: Partial<Pick<UserProfile, "displayName" | "institution" | "orcid" | "photoURL">>
): Promise<UserProfile | null> {
  const db = getAdminDb();
  const existing = await getUserDoc(uid);
  if (!existing) return null;
  const next: UserProfile = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  if (db) await db.collection(COL).doc(uid).set(next);
  return next;
}

/** Admin foundation (used fully in Phase 7). */
export async function setUserRole(uid: string, role: Role): Promise<UserProfile | null> {
  const db = getAdminDb();
  const existing = await getUserDoc(uid);
  if (!existing) return null;
  const next: UserProfile = { ...existing, role, updatedAt: new Date().toISOString() };
  if (db) await db.collection(COL).doc(uid).set(next);
  await syncClaims(uid, role);
  return next;
}

export async function setUserActive(uid: string, active: boolean): Promise<void> {
  const db = getAdminDb();
  const app = getAdminApp();
  if (db) await db.collection(COL).doc(uid).set({ active, updatedAt: new Date().toISOString() }, { merge: true });
  if (app) await getAuth(app).updateUser(uid, { disabled: !active });
}

export async function listUsers(): Promise<UserProfile[]> {
  const db = getAdminDb();
  if (!db) return [];
  const snap = await db.collection(COL).get();
  return snap.docs.map((d) => d.data() as UserProfile).sort((a, b) => a.email.localeCompare(b.email));
}
