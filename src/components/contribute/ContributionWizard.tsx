"use client";
import { useState } from "react";
import { Button, Card, Field, Input, Textarea, Select, Badge } from "@/components/ui";
import { CATEGORIES } from "@/lib/constants";
import { apiPost } from "@/lib/client";
import type { UploadedFile } from "@/lib/types";

type Step = 0 | 1 | 2 | 3 | 4;

const empty = {
  name: "", email: "", affiliation: "", orcid: "",
  title: "", category: "model", description: "", purpose: "",
  dependencies: "", requirements: "", installation: "", execution: "",
  inputFiles: "", outputFiles: "", notes: "", license: "", keywords: ""
};

export function ContributionWizard() {
  const [step, setStep] = useState<Step>(0);
  const [f, setF] = useState({ ...empty });
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [resultId, setResultId] = useState<string | null>(null);

  const set = (k: keyof typeof empty) => (e: any) => setF({ ...f, [k]: e.target.value });

  const stepValid = (): boolean => {
    if (step === 0) return f.name.length > 1 && /\S+@\S+/.test(f.email) && f.affiliation.length > 1;
    if (step === 1) return f.title.length > 2 && f.description.length > 9 && f.purpose.length > 4;
    return true;
  };

  async function upload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(fileList)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        setFiles((prev) => [...prev, json.data]);
      }
    } catch (e: any) {
      setError(`Upload failed: ${e.message}. You can still submit; the curator will request files.`);
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const data = await apiPost<{ id: string }>("/api/contributions", {
        submitter: { name: f.name, email: f.email, affiliation: f.affiliation, orcid: f.orcid || undefined },
        metadata: {
          title: f.title, category: f.category, description: f.description, purpose: f.purpose,
          dependencies: f.dependencies, requirements: f.requirements, installation: f.installation,
          execution: f.execution, inputFiles: f.inputFiles, outputFiles: f.outputFiles,
          notes: f.notes, license: f.license || undefined,
          keywords: f.keywords.split(",").map((s) => s.trim()).filter(Boolean)
        },
        files
      });
      setResultId(data.id);
      setStep(4);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 4 && resultId) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-100 text-green-700">✓</div>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Contribution submitted</h2>
        <p className="mt-2 text-slate-600">
          Thank you, {f.name}. Your contribution <strong>“{f.title}”</strong> has been added to the review queue.
          The project curator will generate documentation, review it, and publish it to GitHub.
        </p>
        <p className="mt-2 text-sm text-slate-500">Reference: <code className="rounded bg-slate-100 px-1">{resultId}</code></p>
        <p className="mt-2 text-sm text-slate-500">You'll receive an email at {f.email} when it's published.</p>
        <Button className="mt-6" onClick={() => { setF({ ...empty }); setFiles([]); setResultId(null); setStep(0); }}>
          Submit another
        </Button>
      </Card>
    );
  }

  const labels = ["Your details", "About the work", "Files", "Review"];
  return (
    <div>
      {/* Progress */}
      <div className="mb-6 flex items-center gap-2">
        {labels.map((l, i) => (
          <div key={l} className="flex flex-1 items-center gap-2">
            <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${i <= step ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"}`}>{i + 1}</div>
            <span className={`hidden text-sm sm:block ${i === step ? "font-semibold text-brand-700" : "text-slate-500"}`}>{l}</span>
            {i < labels.length - 1 && <div className={`h-0.5 flex-1 ${i < step ? "bg-brand-600" : "bg-slate-200"}`} />}
          </div>
        ))}
      </div>

      <Card className="p-6">
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required><Input value={f.name} onChange={set("name")} placeholder="Jane Researcher" /></Field>
            <Field label="Email" required hint="Used for notifications and as contact info."><Input type="email" value={f.email} onChange={set("email")} placeholder="jane@uchile.cl" /></Field>
            <Field label="Affiliation" required><Input value={f.affiliation} onChange={set("affiliation")} placeholder="Universidad de Chile" /></Field>
            <Field label="ORCID" hint="Optional"><Input value={f.orcid} onChange={set("orcid")} placeholder="0000-0002-1825-0097" /></Field>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" required><Input value={f.title} onChange={set("title")} placeholder="Seismic risk model for central Chile" /></Field>
              <Field label="Category" required>
                <Select value={f.category} onChange={set("category")}>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Description" required hint="What is it? A few sentences."><Textarea rows={3} value={f.description} onChange={set("description")} /></Field>
            <Field label="Purpose" required hint="Why does it exist / what problem does it solve?"><Textarea rows={2} value={f.purpose} onChange={set("purpose")} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Dependencies" hint="Libraries, tools, versions"><Textarea rows={2} value={f.dependencies} onChange={set("dependencies")} /></Field>
              <Field label="Requirements" hint="Hardware/data prerequisites"><Textarea rows={2} value={f.requirements} onChange={set("requirements")} /></Field>
              <Field label="Installation" hint="How to set it up"><Textarea rows={2} value={f.installation} onChange={set("installation")} /></Field>
              <Field label="Execution" hint="How to run it"><Textarea rows={2} value={f.execution} onChange={set("execution")} /></Field>
              <Field label="Input files" hint="Expected inputs"><Textarea rows={2} value={f.inputFiles} onChange={set("inputFiles")} /></Field>
              <Field label="Output files" hint="What it produces"><Textarea rows={2} value={f.outputFiles} onChange={set("outputFiles")} /></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Keywords" hint="Comma-separated"><Input value={f.keywords} onChange={set("keywords")} placeholder="seismic, hazard, GIS" /></Field>
              <Field label="License" hint="Optional"><Input value={f.license} onChange={set("license")} placeholder="CC-BY-4.0 / MIT" /></Field>
            </div>
            <Field label="Notes" hint="Anything else reviewers should know"><Textarea rows={2} value={f.notes} onChange={set("notes")} /></Field>
          </div>
        )}

        {step === 2 && (
          <div>
            <Field label="Attach files" hint="Models, datasets, PDFs, scripts… Large files (>5 MB) stay in external storage; the curator links them.">
              <input type="file" multiple onChange={(e) => upload(e.target.files)} className="block w-full text-sm" />
            </Field>
            {uploading && <p className="mt-3 text-sm text-brand-600">Uploading…</p>}
            <div className="mt-4 space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <span className="font-mono">{file.name}</span>
                  <span className="flex items-center gap-3">
                    <Badge>{(file.size / 1024).toFixed(1)} KB</Badge>
                    <button className="text-red-500 hover:underline" onClick={() => setFiles(files.filter((_, j) => j !== i))}>remove</button>
                  </span>
                </div>
              ))}
              {!files.length && <p className="text-sm text-slate-500">No files attached yet (optional).</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-sm">
            <h3 className="text-base font-semibold text-slate-900">Review your submission</h3>
            <Row k="Contributor" v={`${f.name} · ${f.affiliation}`} />
            <Row k="Email" v={f.email} />
            <Row k="Title" v={f.title} />
            <Row k="Category" v={CATEGORIES.find((c) => c.value === f.category)?.label || f.category} />
            <Row k="Description" v={f.description} />
            <Row k="Purpose" v={f.purpose} />
            <Row k="Keywords" v={f.keywords || "—"} />
            <Row k="Files" v={files.length ? files.map((x) => x.name).join(", ") : "none"} />
            <p className="rounded-lg bg-brand-50 px-4 py-3 text-brand-800">
              On submit, your contribution enters the curator's review queue. Documentation is drafted automatically
              and nothing is published to GitHub until a curator approves it.
            </p>
          </div>
        )}

        {/* Nav */}
        <div className="mt-6 flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1) as Step)} disabled={step === 0}>Back</Button>
          {step < 3 ? (
            <Button onClick={() => stepValid() ? setStep((s) => (s + 1) as Step) : setError("Please complete the required fields.")}>
              Continue
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>{submitting ? "Submitting…" : "Submit contribution"}</Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-b border-slate-100 py-1.5">
      <span className="font-medium text-slate-500">{k}</span>
      <span className="col-span-2 text-slate-800">{v}</span>
    </div>
  );
}
