"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Button, Input, Field } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";

export default function RegisterPage() {
  const { register, user, configured } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) router.replace("/dashboard"); }, [user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    if (password !== confirm) return setErr("Passwords do not match.");
    setBusy(true);
    try { await register(email, password, name); router.replace("/dashboard"); }
    catch (e: any) { setErr(friendly(e?.code, e?.message)); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-stone-900">Create your account</h1>
      <p className="mt-2 text-sm text-stone-600">Researchers can submit and manage contributions.</p>

      {!configured && <Card className="mt-6 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Authentication is not configured yet (missing Firebase keys).</Card>}

      <Card className="mt-6 space-y-4 p-6">
        {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
          <Field label="Email"><Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field label="Password" hint="At least 8 characters."><Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
          <Field label="Confirm password"><Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></Field>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
        </form>
        <p className="text-center text-sm text-stone-600">Already have an account? <Link href="/login" className="text-accent-600 hover:underline">Sign in</Link></p>
      </Card>
    </div>
  );
}

function friendly(code?: string, fallback?: string) {
  switch (code) {
    case "auth/email-already-in-use": return "An account with this email already exists.";
    case "auth/invalid-email": return "Please enter a valid email.";
    case "auth/weak-password": return "Password is too weak.";
    default: return fallback || "Something went wrong.";
  }
}
