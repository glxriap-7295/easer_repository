"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, Button, Input, Field } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    try { await resetPassword(email); setSent(true); }
    catch (e: any) { setErr(e?.message || "Could not send reset email."); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-stone-900">Reset your password</h1>
      <Card className="mt-6 space-y-4 p-6">
        {sent ? (
          <p className="text-sm text-stone-700">If an account exists for <strong>{email}</strong>, a password-reset link has been sent. Check your inbox.</p>
        ) : (
          <>
            {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
            <form onSubmit={submit} className="space-y-4">
              <Field label="Email" hint="We'll email you a reset link."><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
            </form>
          </>
        )}
        <p className="text-center text-sm"><Link href="/login" className="text-accent-600 hover:underline">Back to sign in</Link></p>
      </Card>
    </div>
  );
}
