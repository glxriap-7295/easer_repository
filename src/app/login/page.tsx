"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Card, Button, Input, Field } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/components/i18n/LanguageProvider";

function LoginForm() {
  const { login, loginGoogle, user, configured } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (user) router.replace(next); }, [user, next, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr("");
    try { await login(email, password); router.replace(next); }
    catch (e: any) { setErr(friendly(e?.code, e?.message)); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-stone-900">{t("auth.signInTitle")}</h1>
      <p className="mt-2 text-sm text-stone-600">{t("auth.signInSubtitle")}</p>
      {!configured && <Card className="mt-6 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Authentication is not configured yet (missing Firebase keys).</Card>}
      <Card className="mt-6 space-y-4 p-6">
        {err && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        <form onSubmit={submit} className="space-y-4">
          <Field label={t("common.email")}><Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
          <Field label={t("common.password")}><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></Field>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? t("auth.signingIn") : t("auth.signInTitle")}</Button>
        </form>
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-accent-600 hover:underline">{t("auth.forgot")}</Link>
          <Link href="/register" className="text-accent-600 hover:underline">{t("auth.create")}</Link>
        </div>
        <div className="text-center text-xs text-stone-400">{t("auth.or")}</div>
        <Button variant="secondary" className="w-full" onClick={() => loginGoogle().catch((e) => setErr(friendly(e?.code, e?.message)))}>{t("auth.continueGoogle")}</Button>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useT();
  return <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-stone-500">{t("common.loading")}</div>}><LoginForm /></Suspense>;
}

function friendly(code?: string, fallback?: string) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found": return "Incorrect email or password.";
    case "auth/too-many-requests": return "Too many attempts. Try again later.";
    case "auth/invalid-email": return "Please enter a valid email.";
    default: return fallback || "Something went wrong.";
  }
}
