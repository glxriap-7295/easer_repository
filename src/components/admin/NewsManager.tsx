"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Button, Input, Textarea, Select, Field, Badge } from "@/components/ui";
import { apiGet, apiPost, apiPatch, apiDelete, uploadFile } from "@/lib/client";
import { EASER_INFO, GITHUB_ORG_URL } from "@/lib/constants";
import type { NewsPost } from "@/lib/types";

// Downscale an image in-browser so cover uploads stay small: returns a Blob (for
// the storage endpoint) and a data URL (fallback when storage has no public URL).
async function downscaleImage(file: File, maxDim = 1600, quality = 0.82): Promise<{ blob: Blob; dataUrl: string }> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error("Could not read the image file.")); r.readAsDataURL(file); });
    return { blob: file, dataUrl };
  }
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale)), h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing is not supported in this browser.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b || file), "image/jpeg", quality));
  return { blob, dataUrl };
}

// External channel connectors. Designed so a real API sync can be wired in later
// (add a `sync()` per connector) without changing this UI. For now each links to
// the official channel and is marked "coming soon".
const CONNECTORS: { key: string; name: string; sub: string; url: string }[] = [
  { key: "linkedin", name: "LinkedIn", sub: "Company Page", url: EASER_INFO.social.linkedin },
  { key: "spotify", name: "Spotify", sub: "Podcast", url: EASER_INFO.social.spotify },
  { key: "youtube", name: "YouTube", sub: "Channel", url: EASER_INFO.social.youtube },
  { key: "instagram", name: "Instagram", sub: "Profile", url: EASER_INFO.social.instagram },
  { key: "github", name: "GitHub", sub: "Organization", url: GITHUB_ORG_URL }
];

export function NewsManager() {
  const [tab, setTab] = useState<"posts" | "connectors">("posts");
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
  async function sync() {
    setBusy("sync"); setErr("");
    try { const r = await apiPost<{ message: string }>("/api/admin/sync-news", {}, true); load(); alert(r.message); }
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

  // Cover upload: downscale, try the storage endpoint (Firebase Storage when
  // configured), and fall back to a compact data URL. Never surfaces raw errors.
  async function setCover(id: string, file: File) {
    setBusy("cover-" + id); setErr("");
    try {
      const { blob, dataUrl } = await downscaleImage(file);
      let coverImage = dataUrl;
      try {
        const jpg = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
        const up = await uploadFile(jpg);
        if (up.url) coverImage = up.url;
      } catch { /* storage unavailable — keep the downscaled data URL */ }
      update(id, { coverImage });
    } catch (e: any) {
      setErr(`Could not add the cover image: ${e.message || "please try a different image."}`);
    } finally { setBusy(""); }
  }

  const tabCls = (t: string) => `border-b-2 px-1 pb-2 text-sm font-medium transition ${tab === t ? "border-brand-700 text-brand-800" : "border-transparent text-stone-500 hover:text-stone-700"}`;

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-stone-200">
        <button className={tabCls("posts")} onClick={() => setTab("posts")}>Published News</button>
        <button className={tabCls("connectors")} onClick={() => setTab("connectors")}>Connectors</button>
      </div>

      {err && <Card className="mt-3 border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</Card>}

      {tab === "posts" ? (
        <>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-stone-500">{posts.length} post(s)</p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" disabled={!!busy} onClick={sync}>Import official news</Button>
              <Button onClick={add} disabled={!!busy}>+ New post</Button>
            </div>
          </div>
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
                    <label className="cursor-pointer text-sm text-accent-700 hover:underline">
                      {busy === "cover-" + p.id ? "Processing…" : p.coverImage ? "Replace cover" : "Upload cover"}
                      <input type="file" accept="image/*" className="hidden" disabled={busy === "cover-" + p.id} onChange={(e) => { const f = e.target.files?.[0]; if (f) setCover(p.id, f); e.target.value = ""; }} />
                    </label>
                    {p.coverImage && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.coverImage} alt="" className="h-10 w-16 rounded object-cover" />}
                  </div>
                  <Field label="Content (Markdown)"><Textarea rows={6} value={p.content} onChange={(e) => update(p.id, { content: e.target.value })} className="font-mono text-xs" /></Field>
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
        </>
      ) : (
        <div className="mt-6">
          <h3 className="font-serif text-lg font-semibold text-stone-900">External Connectors</h3>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">Connect official EASER channels to streamline updates and keep content in sync. Automatic synchronization is coming soon — for now each connector links directly to its official channel.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONNECTORS.map((c) => (
              <Card key={c.key} className="flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-serif font-semibold text-stone-900">{c.name}</p>
                    <p className="text-xs text-stone-500">{c.sub}</p>
                  </div>
                  <Badge color="amber">Coming soon</Badge>
                </div>
                <a href={c.url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm font-medium text-accent-700 hover:underline">Open channel ↗</a>
              </Card>
            ))}
          </div>

          <h3 className="mt-10 font-serif text-lg font-semibold text-stone-900">Manual Import</h3>
          <p className="mt-1 max-w-2xl text-sm text-stone-500">Import news from external channels while automatic sync is not available. Paste a post URL to create a news item, or pull curated official updates.</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="secondary" disabled={!!busy} onClick={sync}>Import official news</Button>
            <Button onClick={() => { setTab("posts"); add(); }} disabled={!!busy}>+ New post from URL</Button>
          </div>
        </div>
      )}
    </div>
  );
}
