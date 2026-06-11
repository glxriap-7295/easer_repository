"use client";
import Link from "next/link";
import { useState } from "react";
import { Card, Button, Input, Field } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/components/i18n/LanguageProvider";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try { await resetPassword(email); setSent(true); }
    catch (e: any) { setErr(e?.message || "Could not send reset email."); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-stone-900">{t("auth.resetTitle")}</h1>
      <Card className="mt-6 space-y-4 p-6">
        {sent ? <p className="text-sm text-stone-700">{t("auth.resetSent")}</p> : (
          <>
            {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
            <form onSubmit={submit} className="space-y-4">
              <Field label={t("common.email")} hint={t("auth.resetHint")}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "…" : t("auth.sendReset")}</Button>
            </form>
          </>
        )}
        <p className="text-center text-sm"><Link href="/login" className="text-accent-600 hover:underline">{t("auth.backToSignIn")}</Link></p>
      </Card>
    </div>
  );
}
