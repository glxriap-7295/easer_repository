"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Button, Badge, Textarea } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { apiGet, apiPost, apiPatch } from "@/lib/client";
import { PROJECT_STATUS_LABEL, type ProjectStatus } from "@/lib/constants";
import type { Project } from "@/lib/types";

export default function ProjectReview() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Project | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    try { const data = await apiGet<Project>(`/api/projects/${id}`, true); setP(data); setDraft(data.draft?.markdown || ""); }
    catch (e: any) { setErr(e.message); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  async function act(fn: () => Promise<any>, tag: string) {
    setBusy(tag); setErr("");
    try { await fn(); await load(); } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }

  if (err && !p) return <div className="mx-auto max-w-3xl px-4 py-12"><Card className="border-amber-200 bg-amber-50 p-4 text-amber-800">{err} — <Link className="underline" href="/admin/projects">back</Link></Card></div>;
  if (!p) return <div className="mx-auto max-w-3xl px-4 py-12 text-stone-500">Loading…</div>;

  const published = ["approved", "published"].includes(p.status);
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link href="/admin/projects" className="text-sm text-accent-600 hover:underline">← Review queue</Link>
      <div className="mt-2 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">{p.title}</h1>
        <Badge color="blue">{PROJECT_STATUS_LABEL[p.status as ProjectStatus]}</Badge>
      </div>

      {err && <Card className="mt-4 border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</Card>}

      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-stone-900">Metadata</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <Meta k="Category" v={p.category} />
          <Meta k="Authors" v={p.authors?.map((a) => a.name + (a.orcid ? ` (${a.orcid})` : "")).join("; ")} />
          <Meta k="Institutions" v={p.institutions?.map((i) => i.name + (i.department ? ` — ${i.department}` : "")).join("; ")} />
          <Meta k="Contact" v={`${p.contactName} <${p.contactEmail}>`} />
          <Meta k="Description" v={p.description} />
          <Meta k="Purpose" v={p.purpose} />
          <Meta k="Keywords" v={p.keywords?.join(", ")} />
          <Meta k="License" v={p.license} />
        </dl>
        <div className="mt-3 text-sm">
          <span className="font-medium text-stone-500">Files ({p.files?.length || 0}): </span>
          {p.files?.length ? p.files.map((f) => f.name).join(", ") : "none"}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-stone-900">README draft</h2>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={busy === "gen"} onClick={() => act(() => apiPost(`/api/projects/${id}/generate-docs`, {}, true), "gen")}>
              {busy === "gen" ? "Generating…" : p.draft ? "Regenerate" : "Generate"}
            </Button>
            {p.draft && <Button variant="ghost" onClick={() => setEditing(!editing)}>{editing ? "Preview" : "Edit"}</Button>}
          </div>
        </div>
        {!p.draft ? (
          <p className="mt-4 text-sm text-stone-500">No draft yet. Generate the README from the submitted metadata.</p>
        ) : editing ? (
          <div className="mt-4">
            <Textarea rows={18} value={draft} onChange={(e) => setDraft(e.target.value)} className="font-mono text-xs" />
            <Button className="mt-3" disabled={busy === "save"} onClick={() => act(() => apiPatch(`/api/projects/${id}`, { draftMarkdown: draft }), "save")}>
              {busy === "save" ? "Saving…" : "Save edits"}
            </Button>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-stone-100 bg-stone-50 p-4"><Markdown>{p.draft.markdown}</Markdown></div>
        )}
      </Card>

      {!published && p.status !== "rejected" && (
        <Card className="mt-6 p-5">
          <h2 className="font-semibold text-stone-900">Decision</h2>
          <p className="mt-1 text-sm text-stone-500">Approving publishes the project folder (README + metadata.json + files) to GitHub.</p>
          <div className="mt-4">
            <Button disabled={busy === "approve"} onClick={() => act(() => apiPost(`/api/projects/${id}/approve`, {}, true), "approve")}>
              {busy === "approve" ? "Publishing…" : "Approve & publish to GitHub"}
            </Button>
          </div>
          <div className="mt-4">
            <Textarea rows={2} placeholder="Note to the researcher…" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" disabled={busy === "changes"} onClick={() => act(() => apiPost(`/api/projects/${id}/reject`, { note, requestChanges: true }, true), "changes")}>Request changes</Button>
              <Button variant="danger" disabled={busy === "reject"} onClick={() => act(() => apiPost(`/api/projects/${id}/reject`, { note }, true), "reject")}>Reject</Button>
            </div>
          </div>
        </Card>
      )}

      {p.githubCommitUrl && (
        <Card className="mt-6 border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Published: <a className="underline" href={p.githubCommitUrl} target="_blank" rel="noreferrer">{p.githubCommitUrl}</a>{p.githubPrNumber ? ` (PR #${p.githubPrNumber})` : ""}
        </Card>
      )}

      <Card className="mt-6 p-5">
        <h2 className="font-semibold text-stone-900">Activity</h2>
        <ul className="mt-3 space-y-1 text-sm text-stone-600">
          {p.audit?.map((a, i) => (
            <li key={i}><span className="text-stone-400">{new Date(a.at).toLocaleString()}</span> — <strong>{a.action}</strong> by {a.actor}{a.note ? ` (${a.note})` : ""}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function Meta({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return <div><dt className="font-medium text-stone-500">{k}</dt><dd className="text-stone-800">{v}</dd></div>;
}
