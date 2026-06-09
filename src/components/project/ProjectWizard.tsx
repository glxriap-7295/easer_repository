"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Card, Button, Input, Textarea, Select, Field, Badge } from "@/components/ui";
import { CATEGORIES } from "@/lib/constants";
import { apiPost, apiPatch, apiGet } from "@/lib/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Author, Institution, UploadedFile, Project } from "@/lib/types";

interface FormState {
  title: string; category: string; description: string; purpose: string;
  authors: Author[]; institutions: Institution[];
  contactName: string; contactEmail: string;
  dependencies: string; requirements: string; installation: string; execution: string;
  inputFiles: string; outputFiles: string; notes: string;
  keywords: string; license: string;
  files: UploadedFile[];
}

const blank: FormState = {
  title: "", category: "model", description: "", purpose: "",
  authors: [{ name: "", email: "", orcid: "" }],
  institutions: [{ name: "", department: "" }],
  contactName: "", contactEmail: "",
  dependencies: "", requirements: "", installation: "", execution: "",
  inputFiles: "", outputFiles: "", notes: "", keywords: "", license: "",
  files: []
};

function fromProject(p: Project): FormState {
  return {
    title: p.title || "", category: p.category || "model",
    description: p.description || "", purpose: p.purpose || "",
    authors: p.authors?.length ? p.authors : [{ name: "", email: "", orcid: "" }],
    institutions: p.institutions?.length ? p.institutions : [{ name: "", department: "" }],
    contactName: p.contactName || "", contactEmail: p.contactEmail || "",
    dependencies: p.dependencies || "", requirements: p.requirements || "",
    installation: p.installation || "", execution: p.execution || "",
    inputFiles: p.inputFiles || "", outputFiles: p.outputFiles || "",
    notes: p.notes || "", keywords: (p.keywords || []).join(", "), license: p.license || "",
    files: p.files || []
  };
}

export function ProjectWizard({ projectId }: { projectId?: string }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [f, setF] = useState<FormState>(blank);
  const [id, setId] = useState<string | undefined>(projectId);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loaded, setLoaded] = useState(!projectId);

  // Prefill contact + first author from the signed-in profile (new projects).
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

  // Resume an existing draft.
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
        setF((s) => ({ ...s, files: [...s.files, json.data] }));
      }
    } catch (e: any) { setErr(`Upload failed: ${e.message}`); }
    finally { setBusy(""); }
  }, []);

  function payload(extra: object = {}) {
    return {
      title: f.title, category: f.category, description: f.description, purpose: f.purpose,
      authors: f.authors.filter((a) => a.name.trim()),
      institutions: f.institutions.filter((i) => i.name.trim()),
      contactName: f.contactName, contactEmail: f.contactEmail,
      dependencies: f.dependencies, requirements: f.requirements, installation: f.installation,
      execution: f.execution, inputFiles: f.inputFiles, outputFiles: f.outputFiles, notes: f.notes,
      keywords: f.keywords.split(",").map((s) => s.trim()).filter(Boolean),
      license: f.license || undefined, files: f.files, ...extra
    };
  }

  async function saveDraft() {
    if (!f.title.trim()) return setErr("Add a title before saving a draft.");
    setBusy("draft"); setErr(""); setInfo("");
    try {
      if (id) { await apiPatch(`/api/projects/${id}`, payload()); }
      else { const r = await apiPost<{ id: string }>("/api/projects", payload({ draft: true }), true); setId(r.id); }
      setInfo("Draft saved. You can close this and resume later from your dashboard.");
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(""); }
  }

  async function submit() {
    setBusy("submit"); setErr(""); setInfo("");
    try {
      if (id) {
        await apiPatch(`/api/projects/${id}`, payload());
        await apiPost(`/api/projects/${id}/submit`, {}, true);
        router.push("/dashboard?submitted=1");
      } else {
        const r = await apiPost<{ id: string }>("/api/projects", payload({ draft: false }), true);
        router.push("/dashboard?submitted=1");
      }
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(""); }
  }

  if (loading) return <p className="text-stone-500">Loading…</p>;
  if (!user) return (
    <Card className="p-6 text-sm text-stone-700">
      Please <a href="/login?next=/contribute" className="text-accent-600 underline">sign in</a> or{" "}
      <a href="/register" className="text-accent-600 underline">create an account</a> to contribute a project.
    </Card>
  );
  if (!loaded) return <p className="text-stone-500">Loading draft…</p>;

  return (
    <div className="space-y-6">
      {err && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>}
      {info && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{info}</div>}

      <Card className="p-6">
        <h2 className="font-serif text-lg font-semibold text-stone-900">Project</h2>
        <div className="mt-4 grid gap-4">
          <Field label="Title" required><Input value={f.title} onChange={set("title")} placeholder="Tsunami Hazard Study for Central Chile" /></Field>
          <Field label="Category" required>
            <Select value={f.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
          </Field>
          <Field label="Description" required><Textarea rows={3} value={f.description} onChange={set("description")} /></Field>
          <Field label="Purpose" required><Textarea rows={2} value={f.purpose} onChange={set("purpose")} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Keywords" hint="Comma-separated"><Input value={f.keywords} onChange={set("keywords")} placeholder="tsunami, hazard, GIS" /></Field>
            <Field label="License" hint="Optional"><Input value={f.license} onChange={set("license")} placeholder="CC-BY-4.0" /></Field>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <RepeatableAuthors authors={f.authors} onChange={(authors) => setF({ ...f, authors })} />
        <div className="mt-6 border-t border-stone-100 pt-6">
          <RepeatableInstitutions institutions={f.institutions} onChange={(institutions) => setF({ ...f, institutions })} />
        </div>
        <div className="mt-6 grid gap-4 border-t border-stone-100 pt-6 sm:grid-cols-2">
          <Field label="Contact name" required><Input value={f.contactName} onChange={set("contactName")} /></Field>
          <Field label="Contact email" required><Input type="email" value={f.contactEmail} onChange={set("contactEmail")} /></Field>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-serif text-lg font-semibold text-stone-900">Files</h2>
        <p className="mt-1 text-sm text-stone-500">Upload all files for this project. Drag and drop or browse. Large files (&gt;5&nbsp;MB) are stored externally and linked.</p>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); upload(e.dataTransfer.files); }}
          className={`mt-4 rounded-xl border-2 border-dashed p-8 text-center transition ${dragOver ? "border-brand-500 bg-brand-50" : "border-stone-300"}`}
        >
          <p className="text-sm text-stone-600">Drag files here, or</p>
          <label className="mt-2 inline-block cursor-pointer rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
            Browse files
            <input type="file" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
          </label>
          {busy === "upload" && <p className="mt-2 text-sm text-accent-600">Uploading…</p>}
        </div>
        <div className="mt-4 space-y-2">
          {f.files.map((file, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm">
              <span className="truncate font-mono">{file.name}</span>
              <span className="flex items-center gap-3">
                <Badge>{(file.size / 1024).toFixed(1)} KB</Badge>
                <button className="text-red-500 hover:underline" onClick={() => setF({ ...f, files: f.files.filter((_, j) => j !== i) })}>remove</button>
              </span>
            </div>
          ))}
          {!f.files.length && <p className="text-sm text-stone-500">No files yet.</p>}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-serif text-lg font-semibold text-stone-900">Technical details <span className="text-sm font-normal text-stone-400">(optional)</span></h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Dependencies"><Textarea rows={2} value={f.dependencies} onChange={set("dependencies")} /></Field>
          <Field label="Requirements"><Textarea rows={2} value={f.requirements} onChange={set("requirements")} /></Field>
          <Field label="Installation"><Textarea rows={2} value={f.installation} onChange={set("installation")} /></Field>
          <Field label="Execution"><Textarea rows={2} value={f.execution} onChange={set("execution")} /></Field>
          <Field label="Input files"><Textarea rows={2} value={f.inputFiles} onChange={set("inputFiles")} /></Field>
          <Field label="Output files"><Textarea rows={2} value={f.outputFiles} onChange={set("outputFiles")} /></Field>
        </div>
        <div className="mt-4"><Field label="Notes"><Textarea rows={2} value={f.notes} onChange={set("notes")} /></Field></div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={submit} disabled={!!busy}>{busy === "submit" ? "Submitting…" : "Submit for review"}</Button>
        <Button variant="secondary" onClick={saveDraft} disabled={!!busy}>{busy === "draft" ? "Saving…" : "Save draft"}</Button>
        <span className="text-xs text-stone-500">Nothing is published until a curator approves it.</span>
      </div>
    </div>
  );
}

function RepeatableAuthors({ authors, onChange }: { authors: Author[]; onChange: (a: Author[]) => void }) {
  const upd = (i: number, k: keyof Author, v: string) => onChange(authors.map((a, j) => j === i ? { ...a, [k]: v } : a));
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-stone-900">Authors</h2>
        <Button variant="ghost" onClick={() => onChange([...authors, { name: "", email: "", orcid: "" }])}>+ Add author</Button>
      </div>
      <div className="mt-3 space-y-3">
        {authors.map((a, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-3">
            <Input placeholder="Full name" value={a.name} onChange={(e) => upd(i, "name", e.target.value)} />
            <Input placeholder="Email (optional)" value={a.email || ""} onChange={(e) => upd(i, "email", e.target.value)} />
            <div className="flex gap-2">
              <Input placeholder="ORCID (optional)" value={a.orcid || ""} onChange={(e) => upd(i, "orcid", e.target.value)} />
              {authors.length > 1 && <button className="text-red-500" onClick={() => onChange(authors.filter((_, j) => j !== i))} aria-label="Remove author">✕</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RepeatableInstitutions({ institutions, onChange }: { institutions: Institution[]; onChange: (i: Institution[]) => void }) {
  const upd = (i: number, k: keyof Institution, v: string) => onChange(institutions.map((x, j) => j === i ? { ...x, [k]: v } : x));
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-stone-900">Institutions</h2>
        <Button variant="ghost" onClick={() => onChange([...institutions, { name: "", department: "" }])}>+ Add institution</Button>
      </div>
      <div className="mt-3 space-y-3">
        {institutions.map((x, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-stone-200 p-3 sm:grid-cols-2">
            <Input placeholder="Institution" value={x.name} onChange={(e) => upd(i, "name", e.target.value)} />
            <div className="flex gap-2">
              <Input placeholder="Department (optional)" value={x.department || ""} onChange={(e) => upd(i, "department", e.target.value)} />
              {institutions.length > 1 && <button className="text-red-500" onClick={() => onChange(institutions.filter((_, j) => j !== i))} aria-label="Remove institution">✕</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
