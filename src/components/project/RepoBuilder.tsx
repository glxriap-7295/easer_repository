"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Button, Input, Textarea, Select, Field, Badge } from "@/components/ui";
import { Stepper } from "@/components/ui/visuals";
import { apiPost } from "@/lib/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/components/i18n/LanguageProvider";
import { PROJECT_TYPES, inferFileCategory, slugify } from "@/lib/constants";
import type { UploadedFile, ProjectResource } from "@/lib/types";

interface Folder { name: string; files: UploadedFile[]; }
interface ExtRes { title: string; provider: string; url: string; description: string; size: string; access: string; }

// Suggested repository folders (Design Board A). Researchers can add unlimited
// custom folders; only folders that contain files are ever created on GitHub.
const SUGGESTED = ["Data", "Models", "Scripts", "Figures", "Results", "Publications", "Docs", "GIS"];
const PROVIDERS = ["NSF DesignSafe", "Zenodo", "Figshare", "Institutional Repository", "Google Drive", "Dropbox", "OneDrive", "AWS S3", "Other"];

export function RepoBuilder() {
  const { user, profile, loading } = useAuth();
  const { t, lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState("research");
  const [customType, setCustomType] = useState("");
  const [keywords, setKeywords] = useState("");

  const [folders, setFolders] = useState<Folder[]>(["Data", "Models", "Scripts", "Figures"].map((name) => ({ name, files: [] })));
  const [selected, setSelected] = useState(0);
  const [newFolder, setNewFolder] = useState("");
  const [drag, setDrag] = useState(false);

  const [ext, setExt] = useState<ExtRes[]>([]);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  if (loading) return <p className="text-stone-500">{t("common.loading")}</p>;
  if (!user) return <Card className="p-6 text-sm text-stone-700">{t("contribute.signInPrompt")} <a href="/login?next=/contribute" className="text-accent-600 underline">{t("common.signIn")}</a></Card>;

  const slug = slugify(title || "your-project");
  const repoName = `easer-${slug}`;
  const filledFolders = folders.filter((f) => f.files.length);
  const totalFiles = folders.reduce((n, f) => n + f.files.length, 0);
  const sel = folders[selected];

  function addFolder(name: string) {
    const n = name.trim();
    if (!n || folders.some((f) => f.name.toLowerCase() === n.toLowerCase())) return;
    setFolders((s) => [...s, { name: n, files: [] }]);
    setNewFolder("");
    setSelected(folders.length);
  }
  function renameFolder(i: number, name: string) { setFolders((s) => s.map((f, j) => (j === i ? { ...f, name } : f))); }
  function deleteFolder(i: number) {
    setFolders((s) => s.filter((_, j) => j !== i));
    setSelected((s) => (s >= i && s > 0 ? s - 1 : s));
  }
  async function upload(list: FileList | null) {
    if (!list || !sel) return;
    setBusy("upload"); setErr("");
    try {
      for (const file of Array.from(list)) {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        const uf: UploadedFile = { ...json.data, folder: sel.name, category: inferFileCategory(json.data.name, sel.name), metadata: {} };
        setFolders((s) => s.map((f, j) => (j === selected ? { ...f, files: [...f.files, uf] } : f)));
      }
    } catch (e: any) { setErr(`Upload failed: ${e.message}`); } finally { setBusy(""); }
  }
  function removeFile(fi: number, xi: number) { setFolders((s) => s.map((f, j) => (j === fi ? { ...f, files: f.files.filter((_, k) => k !== xi) } : f))); }

  function addExt() { setExt((s) => [...s, { title: "", provider: PROVIDERS[0], url: "", description: "", size: "", access: L === "es" ? "Público" : "Public" }]); }
  function setExtField(i: number, patch: Partial<ExtRes>) { setExt((s) => s.map((r, j) => (j === i ? { ...r, ...patch } : r))); }
  function removeExt(i: number) { setExt((s) => s.filter((_, j) => j !== i)); }

  function fmtSize(bytes: number) { return bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`; }

  async function submit() {
    setErr("");
    const files = filledFolders.flatMap((f) => f.files.map((x) => ({ ...x, folder: f.name })));
    if (!files.length) return setErr(L === "es" ? "Añade al menos un archivo a una carpeta." : "Add at least one file to a folder.");
    const resources: ProjectResource[] = ext.filter((r) => r.title.trim() && r.url.trim()).map((r) => ({
      kind: "external", label: r.title, url: r.url, provider: r.provider,
      description: [r.description, r.size && `~${r.size}`, r.access].filter(Boolean).join(" · ")
    }));
    setBusy("submit");
    try {
      await apiPost("/api/projects", {
        draft: false, title, description, purpose: "", projectType,
        authors: [{ name: profile?.displayName || user!.email, email: user!.email, orcid: profile?.orcid }],
        institutions: profile?.institution ? [{ name: profile.institution }] : [{ name: "Universidad de Concepción" }],
        contactName: profile?.displayName || user!.email, contactEmail: user!.email,
        keywords: [projectType === "other" ? customType : "", ...keywords.split(",")].map((s) => s.trim()).filter(Boolean),
        files, resources
      }, true);
      router.push("/dashboard?submitted=1");
    } catch (e: any) { setErr(e.message); setBusy(""); }
  }

  const steps = [
    L === "es" ? "Información del proyecto" : "Project Information",
    L === "es" ? "Constructor de repositorio" : "Repository Builder",
    L === "es" ? "Revisión" : "Review",
    L === "es" ? "Enviar" : "Submit"
  ];
  const canNext1 = title.trim() && description.trim().length >= 10;

  return (
    <div className="space-y-6">
      <Stepper steps={steps} current={step} />
      {err && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}

      {/* ── STEP 1 · Project Information ──────────────────────────────────── */}
      {step === 1 && (
        <Card className="p-6">
          <h2 className="font-serif text-lg font-semibold text-stone-900">{L === "es" ? "Información del proyecto" : "Project Information"}</h2>
          <p className="mt-1 text-sm text-stone-500">{L === "es" ? "Describe tu investigación. Esto genera la portada del proyecto." : "Describe your research. This becomes the project's front page."}</p>
          <div className="mt-5 grid gap-4">
            <Field label={t("contribute.title")} required><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={L === "es" ? "Tipo de proyecto" : "Project type"}>
                <Select value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                  {PROJECT_TYPES.map((pt) => <option key={pt.value} value={pt.value}>{pt.label[L]}</option>)}
                </Select>
                {projectType === "other" && <Input value={customType} onChange={(e) => setCustomType(e.target.value)} placeholder={L === "es" ? "Especifica el tipo…" : "Specify the type…"} className="mt-2" />}
              </Field>
              <Field label={t("contribute.keywords")} hint={L === "es" ? "Separadas por comas" : "Comma-separated"}><Input value={keywords} onChange={(e) => setKeywords(e.target.value)} /></Field>
            </div>
            <Field label={t("contribute.description")} required><Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!canNext1}>{L === "es" ? "Continuar" : "Continue"} →</Button>
          </div>
        </Card>
      )}

      {/* ── STEP 2 · Repository Builder ───────────────────────────────────── */}
      {step === 2 && (
        <>
          <div>
            <h2 className="font-serif text-lg font-semibold text-stone-900">{L === "es" ? "Construye tu repositorio" : "Build your repository"}</h2>
            <p className="mt-1 text-sm text-stone-500">{L === "es" ? "Organiza tus archivos en carpetas. Solo se crean las carpetas con archivos." : "Organize your files into folders. Only folders with files will be created."}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* Structure */}
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-stone-700">{L === "es" ? "Estructura del repositorio" : "Repository structure"}</h3>
              </div>
              <div className="mt-3 space-y-1">
                <p className="flex items-center gap-2 text-sm font-medium text-stone-500"><span>📦</span>{repoName}</p>
                {folders.map((f, i) => (
                  <div key={i} className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-sm ${selected === i ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-stone-50"}`}>
                    <button onClick={() => setSelected(i)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <span className="text-stone-400">{f.files.length ? "📂" : "📁"}</span>
                      <input value={f.name} onClick={(e) => e.stopPropagation()} onChange={(e) => renameFolder(i, e.target.value)}
                        className="min-w-0 flex-1 rounded border-transparent bg-transparent font-medium text-stone-800 focus:border-stone-300 focus:bg-white focus:outline-none" />
                    </button>
                    <span className="flex items-center gap-1.5">
                      {f.files.length > 0 && <Badge>{f.files.length}</Badge>}
                      <button onClick={() => deleteFolder(i)} className="text-xs text-stone-300 hover:text-red-500">✕</button>
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Input value={newFolder} onChange={(e) => setNewFolder(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFolder(newFolder)} placeholder={L === "es" ? "Nueva carpeta…" : "New folder…"} className="text-sm" />
                <Button variant="secondary" onClick={() => addFolder(newFolder)} className="shrink-0">+ {L === "es" ? "Carpeta" : "Folder"}</Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SUGGESTED.filter((s) => !folders.some((f) => f.name.toLowerCase() === s.toLowerCase())).map((s) => (
                  <button key={s} onClick={() => addFolder(s)} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-200">+ {s}</button>
                ))}
              </div>
            </Card>

            {/* Upload to selected */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-stone-700">{L === "es" ? "Subir a" : "Upload to"} “{sel?.name || "—"}”</h3>
              <label
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
                className={`mt-3 flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center text-sm transition ${drag ? "border-brand-500 bg-brand-50" : "border-stone-300 text-stone-500 hover:border-brand-400"}`}>
                <span>{busy === "upload" ? (L === "es" ? "Subiendo…" : "Uploading…") : (L === "es" ? "Arrastra archivos aquí" : "Drag & drop files here")}</span>
                <span className="text-xs text-stone-400">{L === "es" ? "o haz clic para explorar" : "or click to browse"}</span>
                <input type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
              </label>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-stone-400">{L === "es" ? "Archivos en esta carpeta" : "Files in this folder"} ({sel?.files.length || 0})</p>
              <ul className="mt-2 space-y-1">
                {sel?.files.map((f, xi) => (
                  <li key={xi} className="flex items-center justify-between rounded-lg border border-stone-100 px-2 py-1.5 text-xs">
                    <span className="truncate font-mono text-stone-700">{f.name}</span>
                    <span className="flex items-center gap-2 text-stone-400">{fmtSize(f.size)}<button onClick={() => removeFile(selected, xi)} className="text-red-400 hover:text-red-600">✕</button></span>
                  </li>
                ))}
                {!sel?.files.length && <li className="rounded-lg bg-stone-50 px-2 py-3 text-center text-xs text-stone-400">{L === "es" ? "Aún no hay archivos" : "No files yet"}</li>}
              </ul>
            </Card>

            {/* Preview */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-stone-700">{L === "es" ? "Vista previa del repositorio" : "Repository preview"}</h3>
              <div className="mt-3 rounded-lg bg-stone-50 p-3 font-mono text-xs text-stone-600">
                <p>📦 {repoName}/</p>
                <p className="pl-4 text-stone-400">📄 README.md</p>
                {filledFolders.length === 0 && <p className="pl-4 text-stone-400">{L === "es" ? "(añade archivos…)" : "(add files…)"}</p>}
                {filledFolders.map((f) => (
                  <div key={f.name}>
                    <p className="pl-4">📁 {f.name}/</p>
                    {f.files.slice(0, 4).map((x, i) => <p key={i} className="pl-8 text-stone-500">📄 {x.name}</p>)}
                    {f.files.length > 4 && <p className="pl-8 text-stone-400">+{f.files.length - 4} {L === "es" ? "más" : "more"}</p>}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-stone-400">{L === "es" ? "Solo se crearán las carpetas que contienen archivos." : "Only folders containing files will be created."}</p>
            </Card>
          </div>

          {/* External Research Resources */}
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-serif font-semibold text-stone-900">{L === "es" ? "Recursos de investigación externos" : "External Research Resources"}</h3>
                <p className="mt-1 max-w-2xl text-sm text-stone-500">{L === "es" ? "Los conjuntos de datos grandes no deben subirse a GitHub. Enlázalos aquí; el repositorio guardará solo sus metadatos y los archivos permanecen alojados externamente." : "Large datasets should not be uploaded to GitHub. Reference them here; the repository stores only their metadata and the files remain hosted externally."}</p>
              </div>
              <Button variant="secondary" onClick={addExt} className="shrink-0">+ {L === "es" ? "Añadir recurso" : "Add resource"}</Button>
            </div>
            {ext.length > 0 && (
              <div className="mt-4 space-y-4">
                {ext.map((r, i) => (
                  <div key={i} className="rounded-xl border border-stone-200 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label={L === "es" ? "Título" : "Title"}><Input value={r.title} onChange={(e) => setExtField(i, { title: e.target.value })} /></Field>
                      <Field label={L === "es" ? "Proveedor" : "Provider"}>
                        <Select value={r.provider} onChange={(e) => setExtField(i, { provider: e.target.value })}>{PROVIDERS.map((p) => <option key={p}>{p}</option>)}</Select>
                      </Field>
                      <Field label="URL"><Input value={r.url} onChange={(e) => setExtField(i, { url: e.target.value })} placeholder="https://…" /></Field>
                      <Field label={L === "es" ? "Tamaño aproximado" : "Approximate size"}><Input value={r.size} onChange={(e) => setExtField(i, { size: e.target.value })} placeholder={L === "es" ? "p. ej. 12 GB" : "e.g. 12 GB"} /></Field>
                      <Field label={L === "es" ? "Nivel de acceso" : "Access level"}>
                        <Select value={r.access} onChange={(e) => setExtField(i, { access: e.target.value })}>
                          {(L === "es" ? ["Público", "Restringido", "Bajo solicitud", "Embargado"] : ["Public", "Restricted", "On request", "Embargoed"]).map((a) => <option key={a}>{a}</option>)}
                        </Select>
                      </Field>
                      <Field label={L === "es" ? "Descripción" : "Description"}><Input value={r.description} onChange={(e) => setExtField(i, { description: e.target.value })} /></Field>
                    </div>
                    <button onClick={() => removeExt(i)} className="mt-2 text-xs text-red-500 hover:underline">{L === "es" ? "Eliminar recurso" : "Remove resource"}</button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>← {L === "es" ? "Atrás" : "Back"}</Button>
            <Button onClick={() => setStep(3)}>{L === "es" ? "Continuar a revisión" : "Continue to review"} →</Button>
          </div>
        </>
      )}

      {/* ── STEP 3 · Review ───────────────────────────────────────────────── */}
      {step === 3 && (
        <>
          <Card className="p-6">
            <h2 className="font-serif text-lg font-semibold text-stone-900">{L === "es" ? "Revisa tu envío" : "Review your submission"}</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 text-sm">
              <div><dt className="text-xs uppercase tracking-wide text-stone-400">{L === "es" ? "Título" : "Title"}</dt><dd className="mt-0.5 font-medium text-stone-800">{title || "—"}</dd></div>
              <div><dt className="text-xs uppercase tracking-wide text-stone-400">{L === "es" ? "Tipo" : "Type"}</dt><dd className="mt-0.5 font-medium text-stone-800">{projectType === "other" ? customType || "Other" : PROJECT_TYPES.find((p) => p.value === projectType)?.label[L]}</dd></div>
              <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-wide text-stone-400">{L === "es" ? "Descripción" : "Description"}</dt><dd className="mt-0.5 text-stone-700">{description || "—"}</dd></div>
            </dl>
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{L === "es" ? "Repositorio" : "Repository"} · {totalFiles} {L === "es" ? "archivo(s)" : "file(s)"}</p>
              <div className="mt-2 rounded-lg bg-stone-50 p-3 font-mono text-xs text-stone-600">
                {filledFolders.length ? filledFolders.map((f) => <p key={f.name}>📁 {f.name}/ <span className="text-stone-400">({f.files.length})</span></p>) : <p className="text-stone-400">{L === "es" ? "Sin archivos" : "No files"}</p>}
              </div>
            </div>
            {ext.filter((r) => r.title && r.url).length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{L === "es" ? "Recursos externos" : "External resources"}</p>
                <ul className="mt-2 space-y-1 text-sm text-stone-700">{ext.filter((r) => r.title && r.url).map((r, i) => <li key={i}>· {r.title} <span className="text-stone-400">({r.provider})</span></li>)}</ul>
              </div>
            )}
            <p className="mt-5 rounded-lg bg-brand-50 px-4 py-3 text-xs text-brand-800">{t("contribute.publishNote")}</p>
          </Card>
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>← {L === "es" ? "Atrás" : "Back"}</Button>
            <Button onClick={submit} disabled={!!busy}>{busy === "submit" ? t("contribute.submitting") : t("contribute.submitReview")}</Button>
          </div>
        </>
      )}
    </div>
  );
}
