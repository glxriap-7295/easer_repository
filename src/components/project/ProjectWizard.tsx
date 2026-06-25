"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, Button, Input, Textarea, Select, Field, Badge } from "@/components/ui";
import { FILE_CATEGORIES, FILE_METADATA_FIELDS, type FileCategory } from "@/lib/constants";
import { apiPost, apiPatch, apiGet } from "@/lib/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/components/i18n/LanguageProvider";
import type { Author, Institution, UploadedFile, Project } from "@/lib/types";

// New strings (kept inline bilingual to avoid touching the shared dictionary).
const STR = {
  en: {
    step1: "Start", step2: "Project", step3: "Researchers", step4: "Documents", step5: "Metadata",
    createNew: "Create a new project", createNewDesc: "Start a new submission for the EASER repository.",
    manage: "Manage an existing project", manageDesc: "Add files or updates to a project you already own — from your dashboard (no duplicates).",
    goDashboard: "Go to my projects", next: "Continue", back: "Back",
    sizeNotice: "Maximum file size: 5 GB per file. For larger files, please contact the EASER team — future versions will support external cloud storage.",
    metaIntro: "Technical metadata is optional but improves discoverability and organisation. Choose how to provide it:",
    optAll: "Apply to all files", optAllDesc: "Enter metadata once per category; it applies to every file of that type.",
    optEach: "Per file", optEachDesc: "Provide metadata individually for each file.",
    category: "Category", noMetaFor: "No technical metadata fields for these file types — you can submit as is.",
    fileCount: "file(s)"
  },
  es: {
    step1: "Inicio", step2: "Proyecto", step3: "Investigadores", step4: "Documentos", step5: "Metadatos",
    createNew: "Crear un nuevo proyecto", createNewDesc: "Inicia un nuevo envío al repositorio EASER.",
    manage: "Gestionar un proyecto existente", manageDesc: "Añade archivos o actualizaciones a un proyecto que ya posees — desde tu panel (sin duplicados).",
    goDashboard: "Ir a mis proyectos", next: "Continuar", back: "Atrás",
    sizeNotice: "Tamaño máximo de archivo: 5 GB por archivo. Para archivos más grandes, contacta al equipo EASER — las futuras versiones admitirán almacenamiento en la nube.",
    metaIntro: "Los metadatos técnicos son opcionales pero mejoran la búsqueda y la organización. Elige cómo proporcionarlos:",
    optAll: "Aplicar a todos los archivos", optAllDesc: "Ingresa los metadatos una vez por categoría; se aplican a cada archivo de ese tipo.",
    optEach: "Por archivo", optEachDesc: "Proporciona metadatos individualmente para cada archivo.",
    category: "Categoría", noMetaFor: "No hay campos de metadatos para estos tipos de archivo — puedes enviar así.",
    fileCount: "archivo(s)"
  }
};

interface FormState {
  title: string; description: string; purpose: string;
  authors: Author[]; institutions: Institution[]; contactName: string; contactEmail: string;
  keywords: string; license: string; files: UploadedFile[];
}
const blank: FormState = {
  title: "", description: "", purpose: "",
  authors: [{ name: "", email: "", orcid: "" }], institutions: [{ name: "", department: "" }],
  contactName: "", contactEmail: "", keywords: "", license: "", files: []
};
function fromProject(p: Project): FormState {
  return {
    title: p.title || "", description: p.description || "", purpose: p.purpose || "",
    authors: p.authors?.length ? p.authors : [{ name: "", email: "", orcid: "" }],
    institutions: p.institutions?.length ? p.institutions : [{ name: "", department: "" }],
    contactName: p.contactName || "", contactEmail: p.contactEmail || "",
    keywords: (p.keywords || []).join(", "), license: p.license || "", files: p.files || []
  };
}

export function ProjectWizard({ projectId }: { projectId?: string }) {
  const { user, profile, loading } = useAuth();
  const { t, lang } = useT();
  const s = STR[lang === "es" ? "es" : "en"];
  const router = useRouter();
  const [step, setStep] = useState(projectId ? 2 : 1);
  const [f, setF] = useState<FormState>(blank);
  const [id, setId] = useState<string | undefined>(projectId);
  const [metaMode, setMetaMode] = useState<"all" | "perfile">("all");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loaded, setLoaded] = useState(!projectId);

  useEffect(() => {
    if (!projectId && profile) {
      setF((st) => ({
        ...st,
        contactName: st.contactName || profile.displayName,
        contactEmail: st.contactEmail || profile.email,
        authors: st.authors[0]?.name ? st.authors : [{ name: profile.displayName, email: profile.email, orcid: profile.orcid || "" }],
        institutions: st.institutions[0]?.name ? st.institutions : [{ name: profile.institution || "", department: "" }]
      }));
    }
  }, [profile, projectId]);

  useEffect(() => {
    if (!projectId) return;
    apiGet<Project>(`/api/projects/${projectId}`, true)
      .then((p) => { setF(fromProject(p)); setLoaded(true); })
      .catch((e) => { setErr(e.message); setLoaded(true); });
  }, [projectId]);

  const set = (k: keyof FormState) => (e: any) => setF({ ...f, [k]: e.target.value });

  const upload = useCallback(async (list: FileList | File[] | null) => {
    if (!list) return;
    setBusy("upload"); setErr("");
    try {
      for (const file of Array.from(list)) {
        const fd = new FormData(); fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        setF((st) => ({ ...st, files: [...st.files, { ...json.data, category: "other" as FileCategory, metadata: {} }] }));
      }
    } catch (e: any) { setErr(`Upload failed: ${e.message}`); }
    finally { setBusy(""); }
  }, []);

  function setFile(i: number, patch: Partial<UploadedFile>) {
    setF((st) => ({ ...st, files: st.files.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  }
  function setFileMeta(i: number, key: string, val: string) {
    setF((st) => ({ ...st, files: st.files.map((x, j) => (j === i ? { ...x, metadata: { ...(x.metadata || {}), [key]: val } } : x)) }));
  }
  // Option A: set a metadata field on every file of a given category.
  function setCategoryMeta(category: FileCategory, key: string, val: string) {
    setF((st) => ({ ...st, files: st.files.map((x) => (((x.category as FileCategory) || "other") === category ? { ...x, metadata: { ...(x.metadata || {}), [key]: val } } : x)) }));
  }

  function payload(extra: object = {}) {
    return {
      title: f.title, description: f.description, purpose: f.purpose,
      authors: f.authors.filter((a) => a.name.trim()), institutions: f.institutions.filter((i) => i.name.trim()),
      contactName: f.contactName, contactEmail: f.contactEmail,
      keywords: f.keywords.split(",").map((x) => x.trim()).filter(Boolean),
      license: f.license || undefined, files: f.files, ...extra
    };
  }
  async function saveDraft() {
    if (!f.title.trim()) { setStep(2); return setErr("Add a title before saving a draft."); }
    setBusy("draft"); setErr(""); setInfo("");
    try {
      if (id) { await apiPatch(`/api/projects/${id}`, payload()); }
      else { const r = await apiPost<{ id: string }>("/api/projects", payload({ draft: true }), true); setId(r.id); }
      setInfo(t("contribute.saveDraft") + " ✓");
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }
  async function submit() {
    setBusy("submit"); setErr(""); setInfo("");
    try {
      if (id) { await apiPatch(`/api/projects/${id}`, payload()); await apiPost(`/api/projects/${id}/submit`, {}, true); }
      else { await apiPost("/api/projects", payload({ draft: false }), true); }
      router.push("/dashboard?submitted=1");
    } catch (e: any) { setErr(e.message); } finally { setBusy(""); }
  }

  if (loading) return <p className="text-stone-500">{t("common.loading")}</p>;
  if (!user) return (
    <Card className="p-6 text-sm text-stone-700">
      {t("contribute.signInPrompt")} <a href="/login?next=/contribute" className="text-accent-600 underline">{t("common.signIn")}</a>
    </Card>
  );
  if (!loaded) return <p className="text-stone-500">{t("common.loading")}</p>;

  const steps = [s.step1, s.step2, s.step3, s.step4, s.step5];
  const categoriesPresent = FILE_CATEGORIES.filter((c) => f.files.some((x) => ((x.category as FileCategory) || "other") === c.value));
  const metaCategories = categoriesPresent.filter((c) => (FILE_METADATA_FIELDS[c.value] || []).length);

  function next() {
    setErr("");
    if (step === 2 && (!f.title.trim() || f.description.trim().length < 10 || !f.purpose.trim())) return setErr("Please complete title, description and purpose.");
    if (step === 3 && (!f.authors.some((a) => a.name.trim()) || !f.institutions.some((i) => i.name.trim()) || !f.contactName.trim() || !f.contactEmail.trim())) return setErr("Add at least one author, one institution, and contact details.");
    setStep((x) => Math.min(5, x + 1));
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {steps.map((label, i) => {
          const n = i + 1;
          return (
            <li key={label} className="flex items-center gap-2">
              <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${n === step ? "bg-brand-700 text-white" : n < step ? "bg-brand-200 text-brand-800" : "bg-stone-200 text-stone-500"}`}>{n}</span>
              <span className={n === step ? "font-medium text-brand-800" : "text-stone-500"}>{label}</span>
              {n < steps.length && <span className="text-stone-300">→</span>}
            </li>
          );
        })}
      </ol>

      {err && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
      {info && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{info}</div>}

      {/* Step 1 — Create or manage */}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-serif text-lg font-semibold text-stone-900">{s.createNew}</h2>
            <p className="mt-1 text-sm text-stone-600">{s.createNewDesc}</p>
            <Button className="mt-4" onClick={() => setStep(2)}>{s.next}</Button>
          </Card>
          <Card className="p-6">
            <h2 className="font-serif text-lg font-semibold text-stone-900">{s.manage}</h2>
            <p className="mt-1 text-sm text-stone-600">{s.manageDesc}</p>
            <Link href="/dashboard" className="mt-4 inline-block text-accent-700 hover:underline">{s.goDashboard} →</Link>
          </Card>
        </div>
      )}

      {/* Step 2 — Project details */}
      {step === 2 && (
        <Card className="p-6">
          <h2 className="font-serif text-lg font-semibold text-stone-900">{t("contribute.project")}</h2>
          <div className="mt-4 grid gap-4">
            <Field label={t("contribute.title")} required><Input value={f.title} onChange={set("title")} /></Field>
            <Field label={t("contribute.description")} required><Textarea rows={3} value={f.description} onChange={set("description")} /></Field>
            <Field label={t("contribute.purpose")} required><Textarea rows={2} value={f.purpose} onChange={set("purpose")} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("contribute.keywords")}><Input value={f.keywords} onChange={set("keywords")} /></Field>
              <Field label={t("contribute.license")}><Input value={f.license} onChange={set("license")} /></Field>
            </div>
          </div>
        </Card>
      )}

      {/* Step 3 — Researcher details */}
      {step === 3 && (
        <Card className="p-6">
          <Repeatable kind="author" t={t} rows={f.authors} onChange={(authors) => setF({ ...f, authors: authors as Author[] })} />
          <div className="mt-6 border-t border-stone-100 pt-6">
            <Repeatable kind="institution" t={t} rows={f.institutions} onChange={(institutions) => setF({ ...f, institutions: institutions as Institution[] })} />
          </div>
          <div className="mt-6 grid gap-4 border-t border-stone-100 pt-6 sm:grid-cols-2">
            <Field label={t("contribute.contactName")} required><Input value={f.contactName} onChange={set("contactName")} /></Field>
            <Field label={t("contribute.contactEmail")} required><Input type="email" value={f.contactEmail} onChange={set("contactEmail")} /></Field>
          </div>
        </Card>
      )}

      {/* Step 4 — Upload documents (with size disclaimer + per-file category) */}
      {step === 4 && (
        <Card className="p-6">
          <h2 className="font-serif text-lg font-semibold text-stone-900">{t("contribute.filesSection")}</h2>
          <div className="mt-2 rounded-lg border border-accent-200 bg-accent-50 px-4 py-3 text-xs text-stone-700">{s.sizeNotice}</div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files); }}
            className={`mt-4 rounded-xl border-2 border-dashed p-8 text-center transition ${dragOver ? "border-brand-500 bg-brand-50" : "border-stone-300"}`}
          >
            <p className="text-sm text-stone-600">{t("contribute.dragHint")}</p>
            <label className="mt-2 inline-block cursor-pointer rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
              {t("contribute.browseFiles")}
              <input type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
            </label>
            {busy === "upload" && <p className="mt-2 text-sm text-accent-600">{t("contribute.uploading")}</p>}
          </div>
          <div className="mt-4 space-y-2">
            {f.files.map((file, i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 p-3 text-sm">
                <span className="truncate font-mono">{file.name}</span>
                <span className="flex items-center gap-2">
                  <label className="text-xs text-stone-500">{s.category}:</label>
                  <Select value={file.category || "other"} onChange={(e) => setFile(i, { category: e.target.value as FileCategory })} className="w-44">
                    {FILE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </Select>
                  <Badge>{(file.size / 1024).toFixed(1)} KB</Badge>
                  <button className="text-red-500" onClick={() => setF({ ...f, files: f.files.filter((_, j) => j !== i) })}>✕</button>
                </span>
              </div>
            ))}
            {!f.files.length && <p className="text-sm text-stone-500">{t("contribute.noFiles")}</p>}
          </div>
        </Card>
      )}

      {/* Step 5 — Metadata (Option A: all, Option B: per file) */}
      {step === 5 && (
        <Card className="p-6">
          <h2 className="font-serif text-lg font-semibold text-stone-900">{t("contribute.technical")} <span className="text-sm font-normal text-stone-400">({t("common.optional")})</span></h2>
          <p className="mt-1 text-sm text-stone-500">{s.metaIntro}</p>
          {!metaCategories.length ? (
            <p className="mt-4 text-sm text-stone-500">{s.noMetaFor}</p>
          ) : (
            <>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setMetaMode("all")} className={`rounded-lg border px-3 py-1.5 text-sm ${metaMode === "all" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-300 text-stone-600"}`}>{s.optAll}</button>
                <button onClick={() => setMetaMode("perfile")} className={`rounded-lg border px-3 py-1.5 text-sm ${metaMode === "perfile" ? "border-brand-600 bg-brand-50 text-brand-800" : "border-stone-300 text-stone-600"}`}>{s.optEach}</button>
              </div>
              <p className="mt-1 text-xs text-stone-400">{metaMode === "all" ? s.optAllDesc : s.optEachDesc}</p>

              {metaMode === "all" ? (
                <div className="mt-4 space-y-4">
                  {metaCategories.map((c) => {
                    const rep = f.files.find((x) => ((x.category as FileCategory) || "other") === c.value);
                    return (
                      <div key={c.value} className="rounded-lg border border-stone-200 p-3">
                        <p className="font-serif font-semibold text-brand-800">{c.label} <span className="text-xs font-normal text-stone-400">({f.files.filter((x) => ((x.category as FileCategory) || "other") === c.value).length} {s.fileCount})</span></p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {(FILE_METADATA_FIELDS[c.value] || []).map((fld) => (
                            <label key={fld.key} className="text-xs text-stone-500">{fld.label}
                              <Input value={(rep?.metadata || {})[fld.key] || ""} onChange={(e) => setCategoryMeta(c.value, fld.key, e.target.value)} className="mt-1" />
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {f.files.map((file, i) => {
                    const fields = FILE_METADATA_FIELDS[(file.category as FileCategory) || "other"] || [];
                    if (!fields.length) return null;
                    return (
                      <div key={i} className="rounded-lg border border-stone-200 p-3">
                        <p className="truncate font-mono text-sm">{file.name}</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {fields.map((fld) => (
                            <label key={fld.key} className="text-xs text-stone-500">{fld.label}
                              <Input value={(file.metadata || {})[fld.key] || ""} onChange={(e) => setFileMeta(i, fld.key, e.target.value)} className="mt-1" />
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </Card>
      )}

      {/* Navigation */}
      <div className="flex flex-wrap items-center gap-3">
        {step > 1 && <Button variant="ghost" onClick={() => { setErr(""); setStep((x) => Math.max(1, x - 1)); }}>{s.back}</Button>}
        {step > 1 && step < 5 && <Button onClick={next}>{s.next}</Button>}
        {step === 5 && <Button onClick={submit} disabled={!!busy}>{busy === "submit" ? t("contribute.submitting") : t("contribute.submitReview")}</Button>}
        {step > 1 && <Button variant="secondary" onClick={saveDraft} disabled={!!busy}>{busy === "draft" ? t("contribute.saving") : t("contribute.saveDraft")}</Button>}
        {step >= 2 && <span className="text-xs text-stone-500">{t("contribute.publishNote")}</span>}
      </div>
    </div>
  );
}

function Repeatable({ kind, rows, onChange, t }: {
  kind: "author" | "institution"; rows: any[]; onChange: (r: any[]) => void; t: (k: string) => string;
}) {
  const isAuthor = kind === "author";
  const title = isAuthor ? t("contribute.authors") : t("contribute.institutions");
  const addLabel = isAuthor ? t("contribute.addAuthor") : t("contribute.addInstitution");
  const empty = isAuthor ? { name: "", email: "", orcid: "" } : { name: "", department: "" };
  const upd = (i: number, k: string, v: string) => onChange(rows.map((r, j) => j === i ? { ...r, [k]: v } : r));
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-stone-900">{title}</h2>
        <Button variant="ghost" onClick={() => onChange([...rows, empty])}>{addLabel}</Button>
      </div>
      <div className="mt-3 space-y-3">
        {rows.map((r, i) => (
          <div key={i} className={`grid gap-2 rounded-lg border border-stone-200 p-3 ${isAuthor ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            <Input placeholder={isAuthor ? "Name" : "Institution"} value={r.name} onChange={(e) => upd(i, "name", e.target.value)} />
            {isAuthor ? (
              <>
                <Input placeholder="Email" value={r.email || ""} onChange={(e) => upd(i, "email", e.target.value)} />
                <div className="flex gap-2">
                  <Input placeholder="ORCID" value={r.orcid || ""} onChange={(e) => upd(i, "orcid", e.target.value)} />
                  {rows.length > 1 && <button className="text-red-500" onClick={() => onChange(rows.filter((_, j) => j !== i))}>✕</button>}
                </div>
              </>
            ) : (
              <div className="flex gap-2">
                <Input placeholder="Department" value={r.department || ""} onChange={(e) => upd(i, "department", e.target.value)} />
                {rows.length > 1 && <button className="text-red-500" onClick={() => onChange(rows.filter((_, j) => j !== i))}>✕</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
