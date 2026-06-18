"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Button, Select, Badge } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiGet, apiPost } from "@/lib/client";
import { FILE_CATEGORIES, type FileCategory } from "@/lib/constants";
import type { Project, UploadedFile } from "@/lib/types";

// Project evolution UI: add files to an existing approved/published project.
// Publishing a new version + regenerating docs happens automatically server-side.
export default function AddFilesPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { if (!loading && !user) router.replace(`/login?next=/projects/${id}/add`); }, [loading, user, id, router]);
  useEffect(() => {
    if (!user) return;
    apiGet<Project>(`/api/projects/${id}`, true).then(setProject).catch((e) => setErr(e.message));
  }, [user, id]);

  async function upload(list: FileList | null) {
    if (!list) return;
    setBusy("upload"); setErr("");
    try {
      for (const file of Array.from(list)) {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        setFiles((s) => [...s, { ...json.data, category: "other" as FileCategory, metadata: {} }]);
      }
    } catch (e: any) { setErr(`Upload failed: ${e.message}`); } finally { setBusy(""); }
  }

  async function publish() {
    if (!files.length) return setErr("Upload at least one file.");
    setBusy("publish"); setErr("");
    try {
      await apiPost(`/api/projects/${id}/add-files`, { files }, true);
      router.push(`/dashboard?submitted=1`);
    } catch (e: any) { setErr(e.message); setBusy(""); }
  }

  if (loading || !user) return <div className="mx-auto max-w-3xl px-4 py-16 text-stone-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/dashboard" className="text-sm text-accent-700 hover:underline">← My projects</Link>
      <h1 className="mt-2 text-2xl font-bold text-stone-900">Add files{project ? ` — ${project.title}` : ""}</h1>
      <p className="mt-1 text-sm text-stone-500">New files are added to this project and the project is re-submitted for admin approval. On approval, a new version is published and the documentation regenerates automatically. This does not create a duplicate project.</p>

      {err && <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}

      <Card className="mt-6 p-6">
        <label className="inline-block cursor-pointer rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
          Browse files
          <input type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
        </label>
        {busy === "upload" && <span className="ml-2 text-sm text-accent-600">Uploading…</span>}

        <div className="mt-4 space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 p-3 text-sm">
              <span className="truncate font-mono">{file.name}</span>
              <span className="flex items-center gap-2">
                <Select value={file.category || "other"} onChange={(e) => setFiles((s) => s.map((x, j) => j === i ? { ...x, category: e.target.value as FileCategory } : x))} className="w-44">
                  {FILE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
                <Badge>{(file.size / 1024).toFixed(1)} KB</Badge>
                <button className="text-red-500" onClick={() => setFiles((s) => s.filter((_, j) => j !== i))}>✕</button>
              </span>
            </div>
          ))}
          {!files.length && <p className="text-sm text-stone-500">No files added yet.</p>}
        </div>

        <div className="mt-6">
          <Button onClick={publish} disabled={!!busy}>{busy === "publish" ? "Submitting…" : "Add files & submit for approval"}</Button>
        </div>
      </Card>
    </div>
  );
}
