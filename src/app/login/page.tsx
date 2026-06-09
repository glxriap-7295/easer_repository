"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Input, Field } from "@/components/ui";
import { isFirebaseConfigured } from "@/lib/firebase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    import("firebase/auth").then(({ onAuthStateChanged }) => {
      import("@/lib/firebase/client").then(({ auth }) => {
        onAuthStateChanged(auth, (u) => setUser(u?.email ?? null));
      });
    });
  }, []);

  async function google() {
    setMsg("");
    try {
      const { signInWithPopup } = await import("firebase/auth");
      const { auth, googleProvider } = await import("@/lib/firebase/client");
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) { setMsg(e.message); }
  }
  async function emailSignIn() {
    setMsg("");
    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const { auth } = await import("@/lib/firebase/client");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) { setMsg(e.message); }
  }
  async function logout() {
    const { signOut } = await import("firebase/auth");
    const { auth } = await import("@/lib/firebase/client");
    await signOut(auth);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Curator sign-in</h1>
      <p className="mt-2 text-sm text-slate-600">Only authorized curators can access the review dashboard.</p>

      {!isFirebaseConfigured ? (
        <Card className="mt-6 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Firebase is not yet configured. In development the dashboard is accessible without sign-in for the demo.
          Go to <Link className="underline" href="/admin">the dashboard</Link>.
        </Card>
      ) : user ? (
        <Card className="mt-6 p-6">
          <p className="text-slate-700">Signed in as <strong>{user}</strong>.</p>
          <div className="mt-4 flex gap-2">
            <Link href="/admin" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white">Go to dashboard</Link>
            <Button variant="secondary" onClick={logout}>Sign out</Button>
          </div>
        </Card>
      ) : (
        <Card className="mt-6 space-y-4 p-6">
          {msg && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{msg}</p>}
          <Button className="w-full" onClick={google}>Sign in with Google</Button>
          <div className="text-center text-xs text-slate-400">or</div>
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          <Button variant="secondary" className="w-full" onClick={emailSignIn}>Sign in with email</Button>
        </Card>
      )}
    </div>
  );
}
