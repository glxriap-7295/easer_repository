"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Button, Input, Field } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLE_LABEL } from "@/lib/roles";
import { apiPatch } from "@/lib/client";

export default function ProfilePage() {
  const { user, profile, role, loading, changePassword, refreshProfile } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [institution, setInstitution] = useState("");
  const [orcid, setOrcid] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace("/login?next=/profile"); }, [loading, user, router]);
  useEffect(() => {
    if (profile) { setDisplayName(profile.displayName || ""); setInstitution(profile.institution || ""); setOrcid(profile.orcid || ""); }
  }, [profile]);

  if (loading || !user) return <div className="mx-auto max-w-2xl px-4 py-16 text-stone-500">Loading…</div>;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(""); setMsg("");
    try { await apiPatch("/api/me", { displayName, institution, orcid }); await refreshProfile(); setMsg("Profile updated."); }
    catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function onAvatar(files: FileList | null) {
    if (!files?.[0]) return;
    setUploading(true); setErr(""); setMsg("");
    try {
      const fd = new FormData(); fd.append("file", files[0]);
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const upJson = await up.json();
      if (!upJson.ok) throw new Error(upJson.error);
      await apiPatch("/api/me", { photoURL: upJson.data.url || "" });
      await refreshProfile(); setMsg("Avatar updated.");
    } catch (e: any) { setErr(`Avatar upload failed: ${e.message}`); }
    finally { setUploading(false); }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-stone-900">Profile</h1>
      <p className="mt-1 text-sm text-stone-500">{user.email}{role && <> · <span className="font-medium text-brand-800">{ROLE_LABEL[role]}</span></>}</p>

      {msg && <p className="mt-4 rounded bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}
      {err && <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-semibold text-stone-900">Details</h2>
        <div className="mt-4 flex items-center gap-4">
          {profile?.photoURL
            ? // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.photoURL} alt="" className="h-16 w-16 rounded-full object-cover" />
            : <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-700 text-lg font-semibold text-white">{(displayName || user.email || "U").slice(0,1).toUpperCase()}</span>}
          <label className="text-sm">
            <span className="mb-1 block text-stone-600">Profile picture (optional)</span>
            <input type="file" accept="image/*" onChange={(e) => onAvatar(e.target.files)} className="text-sm" />
            {uploading && <span className="ml-2 text-accent-600">uploading…</span>}
          </label>
        </div>
        <form onSubmit={saveProfile} className="mt-4 grid gap-4">
          <Field label="Display name"><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></Field>
          <Field label="Institution"><Input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="Universidad de Chile" /></Field>
          <Field label="ORCID" hint="Optional"><Input value={orcid} onChange={(e) => setOrcid(e.target.value)} placeholder="0000-0002-1825-0097" /></Field>
          <div><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button></div>
        </form>
      </Card>

      <ChangePassword onError={setErr} onMsg={setMsg} change={changePassword} />
    </div>
  );
}

function ChangePassword({ change, onError, onMsg }: {
  change: (a: string, b: string) => Promise<void>;
  onError: (s: string) => void;
  onMsg: (s: string) => void;
}) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); onError(""); onMsg("");
    if (next.length < 8) return onError("New password must be at least 8 characters.");
    if (next !== confirm) return onError("New passwords do not match.");
    setBusy(true);
    try { await change(cur, next); setCur(""); setNext(""); setConfirm(""); onMsg("Password changed."); }
    catch (e: any) {
      onError(e?.code === "auth/wrong-password" || e?.code === "auth/invalid-credential" ? "Current password is incorrect." : (e?.message || "Could not change password."));
    } finally { setBusy(false); }
  }

  return (
    <Card className="mt-6 p-6">
      <h2 className="text-lg font-semibold text-stone-900">Change password</h2>
      <p className="mt-1 text-sm text-stone-500">For email/password accounts. (Google accounts manage their password with Google.)</p>
      <form onSubmit={submit} className="mt-4 grid gap-4">
        <Field label="Current password"><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} required /></Field>
        <Field label="New password"><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} required /></Field>
        <Field label="Confirm new password"><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></Field>
        <div><Button type="submit" variant="secondary" disabled={busy}>{busy ? "Updating…" : "Update password"}</Button></div>
      </form>
    </Card>
  );
}
