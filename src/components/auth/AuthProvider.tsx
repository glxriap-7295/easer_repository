"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  setPersistence, browserLocalPersistence, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
  sendPasswordResetEmail, updatePassword, reauthenticateWithCredential,
  EmailAuthProvider, updateProfile, signInWithPopup, type User
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Role, UserProfile } from "@/lib/roles";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  role: Role | null;
  loading: boolean;
  configured: boolean;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);
export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within <AuthProvider>");
  return v;
};

// One-time sync after sign-in: ensure the Firestore user doc + claims, refresh
// the token to pick up the role, then mint the httpOnly session cookie used by
// server-side route/page guards.
async function syncSession(user: User): Promise<UserProfile | null> {
  const idToken = await user.getIdToken();
  const syncRes = await fetch("/api/auth/sync", {
    method: "POST",
    headers: { authorization: `Bearer ${idToken}` }
  });
  const syncJson = await syncRes.json().catch(() => null);
  const refreshed = await user.getIdToken(true); // pick up custom claims
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken: refreshed })
  });
  return syncJson?.ok ? (syncJson.data as UserProfile) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const p = await syncSession(u);
          setProfile(p);
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
        fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    await syncSession(cred.user).then(setProfile);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!auth.currentUser?.email) throw new Error("Not signed in");
    const cred = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, cred);
    await updatePassword(auth.currentUser, newPassword);
  }, []);

  const refreshProfile = useCallback(async () => {
    const res = await fetch("/api/me", { headers: await bearer() });
    const json = await res.json().catch(() => null);
    if (json?.ok) setProfile(json.data);
  }, []);

  const value: AuthState = {
    user, profile, role: profile?.role ?? null, loading, configured: isFirebaseConfigured,
    register, login, loginGoogle, logout, resetPassword, changePassword, refreshProfile
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

async function bearer(): Promise<HeadersInit> {
  const u = auth.currentUser;
  return u ? { authorization: `Bearer ${await u.getIdToken()}` } : {};
}
