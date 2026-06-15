"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, Button, Input, Textarea, Select, Field, Badge } from "@/components/ui";
import { FILE_CATEGORIES, FILE_METADATA_FIELDS, type FileCategory } from "@/lib/constants";
import { apiPost, apiPatch, apiGet } from "@/lib/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/components/i18n/LanguageProvider";
import type { Author, Institution, UploadedFile, Project } from "@/lib/types";

interface FormState {
  title: string; description: string; purpose: string;
  authors: Author[]; institutions: Institution[]; contactName: string; contactEmail: string;
  keywords: string; license: string; notes: string;
  files: UploadedFile[];
}

const blank: FormState = {
  title: "", description: "", purpose: "",
  authors: [{ name: "", email: "", orcid: "" }], institutions: [{ name: "", department: "" }],
  contactName: "", contactEmail: "", keywords: "", license: "", notes: "", files: []
};

function fromProject(p: Project): FormState {
  return {
    title: p.title || "", description: p.description || "", purpose: p.purpose || "",
    authors: p.authors?.length ? p.authors : [{ name: "", email: "", orcid: "" }],
    institutions: p.institutions?.length ? p.institutions : [{ name: "", department: "" }],
    contactName: p.contactName || "", contactEmail: p.contactEmail || "",
    keywords: (p.keywords || []).join(", "), license: p.license || "", notes: p.notes || "",
    files: p.files || []
  };
}

export function ProjectWizard({ projectId }: { projectId?: string }) {
  const { user, profile, loading } = useAuth();
  const { t } = useT();
  const router = useRouter();
  const [f, setF] = useState<FormState>(blank);
  const [id, setId] = useState<string | undefined>(projectId);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loaded, setLoaded] = useState(!projectId);

  useEffect(() => {
    if (!projectId && profile) {
      setF((s) => ({
        ...s,
        contactName: s.contactName || profile.displayName,
        contactEmail: s.contactEmail || profile.email,
        authors: s.authors[0]?.name ? s.authors : [{ name: profile.displayName, email: profile.email, orcid: profile.orcid || "" }],
        institutions: s.institutions[0]?.name ? s.institutions : [{ name: profile.institution || "", department: "" }]
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
        setF((s) => ({ ...s, files: [...s.files, { ...json.data, category: "other" as FileCategory, metadata: {} }] }));
      }
    } catch (e: any) { setErr(`Upload failed: ${e.message}`); }
    finally { setBusy(""); }
  }, []);

  function setFile(i: number, patch: Partial<UploadedFile>) {
    setF((s) => ({ ...s, files: s.files.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  }
  function setFileMeta(i: number, key: string, val: string) {
    setF((s) => ({ ...s, files: s.files.map((x, j) => (j === i ? { ...x, metadata: { ...(x.metadata || {}), [key]: val } } : x)) }));
  }

  function payload(extra: object = {}) {
    return {
      title: f.title, description: f.description, purpose: f.purpose,
      authors: f.authors.filter((a) => a.name.trim()), institutions: f.institutions.filter((i) => i.name.trim()),
      contactName: f.contactName, contactEmail: f.contactEmail,
      keywords: f.keywords.split(",").map((s) => s.trim()).filter(Boolean),
      license: f.license || undefined, notes: f.notes,
      files: f.files, ...extra
    };
  }

  async function saveDraft() {
    if (!f.title.trim()) return setErr("Add a title before saving a draft.");
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

  return (
    <div className="space-y-6">
      {err && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
      {info && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{info}</div>}

      {/* Page 1 — Project information */}
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

      {/* Page 2 + 3 — Files with per-file category + optional metadata */}
      <Card className="p-6">
        <h2 className="font-serif text-lg font-semibold text-stone-900">{t("contribute.filesSection")}</h2>
        <p className="mt-1 text-sm text-stone-500">{t("contribute.optionalHelp")}</p>
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

        <div className="mt-4 space-y-3">
          {f.files.map((file, i) => {
            const fields = FILE_METADATA_FIELDS[(file.category as FileCategory) || "other"] || [];
            return (
              <div key={i} className="rounded-lg border border-stone-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="truncate font-mono text-sm">{file.name}</span>
                  <span className="flex items-center gap-2">
                    <Badge>{(file.size / 1024).toFixed(1)} KB</Badge>
                    <button className="text-red-500 hover:underline" onClick={() => setF({ ...f, files: f.files.filter((_, j) => j !== i) })}>✕</button>
                  </span>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-stone-500">
                    Category
                    <Select value={file.category || "other"} onChange={(e) => setFile(i, { category: e.target.value as FileCategory })} className="mt-1">
                      {FILE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </Select>
                  </label>
                </div>
                {fields.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-accent-700">Optional technical metadata</summary>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {fields.map((fld) => (
                        <label key={fld.key} className="text-xs text-stone-500">
                          {fld.label}
                          <Input value={(file.metadata || {})[fld.key] || ""} onChange={(e) => setFileMeta(i, fld.key, e.target.value)} className="mt-1" />
                        </label>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
          {!f.files.length && <p className="text-sm text-stone-500">{t("contribute.noFiles")}</p>}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={!!busy}>{busy === "submit" ? t("contribute.submitting") : t("contribute.submitReview")}</Button>
        <Button variant="secondary" onClick={saveDraft} disabled={!!busy}>{busy === "draft" ? t("contribute.saving") : t("contribute.saveDraft")}</Button>
        <span className="text-xs text-stone-500">{t("contribute.publishNote")}</span>
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
