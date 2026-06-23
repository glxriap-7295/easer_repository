"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Button, Input, Textarea, Select, Field, Badge } from "@/components/ui";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/client";
import type { NewsPost } from "@/lib/types";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
}

export function NewsManager() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");

  function load() { setLoading(true); apiGet<NewsPost[]>("/api/admin/news", true).then(setPosts).catch((e) => setErr(e.message)).finally(() => setLoading(false)); }
  useEffect(load, []);

  async function add() {
    setBusy("add"); setErr("");
    try { await apiPost("/api/admin/news", { title: "Untitled post", status: "draft", content: "" }, true); load(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }
  async function save(p: NewsPost) {
    setBusy(p.id); setErr("");
    try { await apiPatch(`/api/admin/news/${p.id}`, { ...p, tags: Array.isArray(p.tags) ? p.tags : String(p.tags || "").split(",").map((t) => t.trim()).filter(Boolean) }); load(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }
  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    setBusy(id);
    try { await apiDelete(`/api/admin/news/${id}`); setPosts((s) => s.filter((x) => x.id !== id)); }
    catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }
  function update(id: string, patch: Partial<NewsPost>) { setPosts((s) => s.map((p) => (p.id === id ? { ...p, ...patch } : p))); }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">{posts.length} post(s)</p>
        <Button onClick={add} disabled={!!busy}>+ New post</Button>
      </div>
      {err && <Card className="mt-3 border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</Card>}
      {loading ? <p className="mt-4 text-stone-500">Loading…</p> : (
        <div className="mt-4 space-y-4">
          {posts.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <Badge color={p.status === "published" ? "green" : "slate"}>{p.status}</Badge>
                {p.status === "published" && <Link href={`/news/${p.slug}`} target="_blank" className="text-xs text-accent-700 hover:underline">View ↗</Link>}
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Field label="Title"><Input value={p.title} onChange={(e) => update(p.id, { title: e.target.value })} /></Field>
                <Field label="Subtitle"><Input value={p.subtitle || ""} onChange={(e) => update(p.id, { subtitle: e.target.value })} /></Field>
                <Field label="Author"><Input value={p.authorName || ""} onChange={(e) => update(p.id, { authorName: e.target.value })} /></Field>
                <Field label="Tags (comma-separated)"><Input value={Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags as any) || ""} onChange={(e) => update(p.id, { tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} /></Field>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <label className="cursor-pointer text-sm text-accent-700">
                  {p.coverImage ? "Replace cover" : "Upload cover"}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) update(p.id, { coverImage: await fileToDataUrl(f) }); }} />
                </label>
                {p.coverImage && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.coverImage} alt="" className="h-10 w-16 rounded object-cover" />}
              </div>
              <Field label="Content (Markdown)" ><Textarea rows={6} value={p.content} onChange={(e) => update(p.id, { content: e.target.value })} className="font-mono text-xs" /></Field>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Select value={p.status} onChange={(e) => update(p.id, { status: e.target.value as any })} className="w-40"><option value="draft">Draft</option><option value="published">Published</option></Select>
                <label className="flex items-center gap-1 text-sm text-stone-600"><input type="checkbox" checked={!!p.pinned} onChange={(e) => update(p.id, { pinned: e.target.checked })} /> Featured</label>
                <Button disabled={busy === p.id} onClick={() => save(p)}>{busy === p.id ? "Saving…" : "Save"}</Button>
                <Button variant="danger" disabled={busy === p.id} onClick={() => remove(p.id)}>Delete</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
