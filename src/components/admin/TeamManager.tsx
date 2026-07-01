"use client";
import { useEffect, useState } from "react";
import { Card, Button, Input, Select, Field, Badge } from "@/components/ui";
import { apiGet, apiPost, apiPatch } from "@/lib/client";
import { INSTITUTION_ORDER, TEAM_GROUPS } from "@/lib/constants";
import type { TeamMember } from "@/lib/types";

const GROUPS = TEAM_GROUPS.map((g) => ({ value: g.value, label: g.label.en }));

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export function TeamManager() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  function load() {
    setLoading(true);
    apiGet<TeamMember[]>("/api/admin/team", true).then(setMembers).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function add() {
    setBusy("add"); setErr("");
    try { await apiPost("/api/admin/team", { name: "New member", group: "team", role: "", order: members.length + 1 }, true); load(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }
  async function save(m: TeamMember) {
    setBusy(m.id); setErr("");
    try { await apiPatch(`/api/admin/team/${m.id}`, m); }
    catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }
  async function remove(id: string) {
    if (!confirm("Remove this member?")) return;
    setBusy(id);
    try { const { apiDelete } = await import("@/lib/client"); await apiDelete(`/api/admin/team/${id}`); setMembers((s) => s.filter((x) => x.id !== id)); }
    catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }
  function update(id: string, patch: Partial<TeamMember>) {
    setMembers((s) => s.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">{members.length} member(s)</p>
        <Button onClick={add} disabled={!!busy}>+ Add member</Button>
      </div>
      {err && <Card className="mt-3 border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</Card>}
      {loading ? <p className="mt-4 text-stone-500">Loading…</p> : (
        <div className="mt-4 space-y-3">
          {members.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex flex-wrap items-start gap-4">
                <label className="cursor-pointer">
                  {m.photoURL
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={m.photoURL} alt="" className="h-16 w-16 rounded-full object-cover" />
                    : <span className="grid h-16 w-16 place-items-center rounded-full bg-stone-200 text-xs text-stone-500">photo</span>}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) update(m.id, { photoURL: await fileToDataUrl(f) }); }} />
                </label>
                <div className="grid flex-1 gap-2 sm:grid-cols-2">
                  <Field label="Name"><Input value={m.name} onChange={(e) => update(m.id, { name: e.target.value })} /></Field>
                  <Field label="Role"><Input value={m.role} onChange={(e) => update(m.id, { role: e.target.value })} /></Field>
                  <Field label="Group"><Select value={m.group} onChange={(e) => update(m.id, { group: e.target.value as any })}>{GROUPS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}</Select></Field>
                  <Field label="Institution"><Select value={m.institution || ""} onChange={(e) => update(m.id, { institution: e.target.value })}><option value="">—</option>{INSTITUTION_ORDER.map((i) => <option key={i.canonical} value={i.canonical}>{i.canonical}</option>)}</Select></Field>
                  <Field label="LinkedIn URL"><Input value={m.linkedin || ""} onChange={(e) => update(m.id, { linkedin: e.target.value })} /></Field>
                  <Field label="Display order"><Input type="number" value={m.order} onChange={(e) => update(m.id, { order: Number(e.target.value) })} /></Field>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <label className="flex items-center gap-1 text-sm text-stone-600"><input type="checkbox" checked={!!m.featured} onChange={(e) => update(m.id, { featured: e.target.checked })} /> Featured</label>
                <Button disabled={busy === m.id} onClick={() => save(m)}>{busy === m.id ? "Saving…" : "Save"}</Button>
                <Button variant="danger" disabled={busy === m.id} onClick={() => remove(m.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
