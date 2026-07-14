"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Button, Input, Textarea, Select, Field, Badge } from "@/components/ui";
import { apiPost } from "@/lib/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/components/i18n/LanguageProvider";
import { SUGGESTED_FOLDERS, PROJECT_TYPES, inferFileCategory } from "@/lib/constants";
import type { UploadedFile } from "@/lib/types";

interface Folder { name: string; files: UploadedFile[]; }

// Visual Repository Builder — the researcher constructs the repository BEFORE it
// exists. Nothing touches GitHub until the project is submitted and approved.
// Only folders that contain files are materialised (empty folders are dropped).
export function RepoBuilder() {
  const { user, profile, loading } = useAuth();
  const { t, lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("research");
  const [keywords, setKeywords] = useState("");
  const [customType, setCustomType] = useState("");
  const [folders, setFolders] = useState<Folder[]>(SUGGESTED_FOLDERS.slice(0, 4).map((name) => ({ name, files: [] })));
  const [newFolder, setNewFolder] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  if (loading) return <p className="text-stone-500">{t("common.loading")}</p>;
  if (!user) return <Card className="p-6 text-sm text-stone-700">{t("contribute.signInPrompt")} <a href="/login?next=/contribute/build" className="text-accent-600 underline">{t("common.signIn")}</a></Card>;

  function addFolder(name: string) {
    const n = name.trim();
    if (!n || folders.some((f) => f.name.toLowerCase() === n.toLowerCase())) return;
    setFolders((s) => [...s, { name: n, files: [] }]);
    setNewFolder("");
  }
  function renameFolder(i: number, name: string) { setFolders((s) => s.map((f, j) => (j === i ? { ...f, name } : f))); }
  function deleteFolder(i: number) { setFolders((s) => s.filter((_, j) => j !== i)); }

  async function upload(i: number, list: FileList | null) {
    if (!list) return;
    setBusy(`up-${i}`); setErr("");
    try {
      for (const file of Array.from(list)) {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        const folderName = folders[i].name;
        const uf: UploadedFile = { ...json.data, folder: folderName, category: inferFileCategory(json.data.name, folderName), metadata: {} };
        setFolders((s) => s.map((f, j) => (j === i ? { ...f, files: [...f.files, uf] } : f)));
      }
    } catch (e: any) { setErr(`Upload failed: ${e.message}`); }
    finally { setBusy(""); }
  }
  function removeFile(fi: number, xi: number) {
    setFolders((s) => s.map((f, j) => (j === fi ? { ...f, files: f.files.filter((_, k) => k !== xi) } : f)));
  }

  function payloadFiles(): UploadedFile[] {
    // Only folders with files; each file keeps its folder + inferred category.
    return folders.filter((f) => f.files.length).flatMap((f) => f.files.map((x) => ({ ...x, folder: f.name })));
  }

  async function submit() {
    setErr("");
    if (!title.trim()) return setErr(L === "es" ? "Añade un título." : "Add a title.");
    if (description.trim().length < 10) return setErr(L === "es" ? "Añade una descripción." : "Add a description.");
    const files = payloadFiles();
    if (!files.length) return setErr(L === "es" ? "Añade al menos un archivo a una carpeta." : "Add at least one file to a folder.");
    setBusy("submit");
    try {
      await apiPost("/api/projects", {
        draft: false, title, description, purpose: "", projectType,
        authors: [{ name: profile?.displayName || user!.email, email: user!.email, orcid: profile?.orcid }],
        institutions: profile?.institution ? [{ name: profile.institution }] : [{ name: "EASER" }],
        contactName: profile?.displayName || user!.email, contactEmail: user!.email,
        keywords: [customType, ...keywords.split(",")].map((s) => s.trim()).filter(Boolean),
        files
      }, true);
      router.push("/dashboard?submitted=1");
    } catch (e: any) { setErr(e.message); setBusy(""); }
  }

  const totalFiles = folders.reduce((n, f) => n + f.files.length, 0);

  return (
    <div className="space-y-6">
      {err && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}

      <Card className="p-6">
        <h2 className="font-serif text-lg font-semibold text-stone-900">{L === "es" ? "Información del proyecto" : "Project information"}</h2>
        <div className="mt-4 grid gap-4">
          <Field label={t("contribute.title")} required><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={L === "es" ? "Tipo de proyecto" : "Project type"}>
              <Select value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                {PROJECT_TYPES.map((pt) => <option key={pt.value} value={pt.value}>{pt.label[L]}</option>)}
              </Select>
              {projectType === "other" && <Input value={customType} onChange={(e) => setCustomType(e.target.value)} placeholder={L === "es" ? "Especifica el tipo…" : "Specify the type…"} className="mt-2" />}
            </Field>
            <Field label={t("contribute.keywords")}><Input value={keywords} onChange={(e) => setKeywords(e.target.value)} /></Field>
          </div>
          <Field label={t("contribute.description")} required><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-semibold text-stone-900">{L === "es" ? "Constructor de repositorio" : "Repository builder"}</h2>
          <Badge>{totalFiles} {L === "es" ? "archivo(s)" : "file(s)"}</Badge>
        </div>
        <p className="mt-1 text-sm text-stone-500">{L === "es" ? "Solo se crean en GitHub las carpetas que contienen archivos. Nada se sube hasta que se apruebe el proyecto." : "Only folders that contain files are created on GitHub. Nothing is uploaded until the project is approved."}</p>

        {/* Add folder */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} placeholder={L === "es" ? "Nueva carpeta…" : "New folder…"} className="max-w-xs" />
          <Button variant="secondary" onClick={() => addFolder(newFolder)}>{L === "es" ? "Añadir carpeta" : "Add folder"}</Button>
          <span className="text-xs text-stone-400">{L === "es" ? "Sugeridas" : "Suggested"}:</span>
          {SUGGESTED_FOLDERS.filter((sf) => !folders.some((f) => f.name === sf)).slice(0, 5).map((sf) => (
            <button key={sf} onClick={() => addFolder(sf)} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-200">+ {sf}</button>
          ))}
        </div>

        {/* Folders */}
        <div className="mt-4 space-y-3">
          {folders.map((folder, i) => (
            <div key={i}
              onDragOver={(e) => { e.preventDefault(); setDragIdx(i); }}
              onDragLeave={() => setDragIdx(null)}
              onDrop={(e) => { e.preventDefault(); setDragIdx(null); upload(i, e.dataTransfer.files); }}
              className={`rounded-lg border p-3 ${dragIdx === i ? "border-brand-500 bg-brand-50" : "border-stone-200"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="text-stone-400">📁</span>
                  <input value={folder.name} onChange={(e) => renameFolder(i, e.target.value)} className="rounded border-transparent bg-transparent font-medium text-stone-800 hover:bg-stone-50 focus:border-stone-300 focus:bg-white focus:outline-none" />
                  <Badge>{folder.files.length}</Badge>
                </span>
                <span className="flex items-center gap-2">
                  <label className="cursor-pointer text-xs font-medium text-accent-700 hover:underline">
                    {busy === `up-${i}` ? (L === "es" ? "Subiendo…" : "Uploading…") : (L === "es" ? "Subir archivos" : "Upload files")}
                    <input type="file" multiple className="hidden" onChange={(e) => upload(i, e.target.files)} />
                  </label>
                  <button onClick={() => deleteFolder(i)} className="text-xs text-red-500 hover:underline">{L === "es" ? "Eliminar" : "Delete"}</button>
                </span>
              </div>
              {folder.files.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {folder.files.map((f, xi) => (
                    <li key={xi} className="flex items-center justify-between rounded border border-stone-100 px-2 py-1 text-xs">
                      <span className="truncate font-mono text-stone-700">{f.name}</span>
                      <span className="flex items-center gap-2"><span className="text-stone-400">{(f.size / 1024).toFixed(0)} KB</span><button onClick={() => removeFile(i, xi)} className="text-red-500">✕</button></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={!!busy}>{busy === "submit" ? t("contribute.submitting") : t("contribute.submitReview")}</Button>
        <span className="text-xs text-stone-500">{t("contribute.publishNote")}</span>
      </div>
    </div>
  );
}
