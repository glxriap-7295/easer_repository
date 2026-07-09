"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Button, Input, Select, Field, Badge } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiPost } from "@/lib/client";
import { PROJECT_TYPES } from "@/lib/constants";

interface Preview {
  owner: string; name: string; url: string; description: string; defaultBranch: string;
  sizeKb: number; license: string | null; language: string | null; pushedAt: string | null;
  fileCount: number; folderCount: number; readmePreview: string;
  topLevel: { path: string; type: string }[];
}

const fmtSize = (kb: number) => (kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);

export default function ImportPage() {
  const { user, loading } = useAuth();
  const { t, lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState("research");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { if (!loading && !user) router.replace("/login?next=/contribute/import"); }, [loading, user, router]);
  if (loading || !user) return <div className="mx-auto max-w-2xl px-4 py-16 text-stone-500">{t("common.loading")}</div>;

  async function analyze() {
    setErr(""); setBusy(true);
    try {
      const r = await apiPost<Preview>("/api/projects/import/preview", { url }, true);
      setPreview(r); setTitle(r.name); setStep(2);
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  async function doImport() {
    setErr(""); setBusy(true);
    try {
      const r = await apiPost<{ id: string }>("/api/projects/import", { url, title: title || undefined, projectType }, true);
      router.push(`/projects/${r.id}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  const steps = [L === "es" ? "Fuente" : "Source", L === "es" ? "Revisión" : "Review", L === "es" ? "Importar" : "Import"];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">{L === "es" ? "Importar repositorio existente" : "Import existing repository"}</h1>
      <p className="mt-2 text-stone-600">{L === "es" ? "Pega la URL de un repositorio de GitHub. La plataforma analiza su estructura, genera un resumen científico y crea la página del proyecto — sin modificar el repositorio original." : "Paste a GitHub repository URL. The platform analyses its structure, generates a Scientific Overview and creates the project page — without modifying the original repository."}</p>

      <ol className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        {steps.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-semibold ${i + 1 === step ? "bg-brand-700 text-white" : i + 1 < step ? "bg-brand-200 text-brand-800" : "bg-stone-200 text-stone-500"}`}>{i + 1}</span>
            <span className={i + 1 === step ? "font-medium text-brand-800" : "text-stone-500"}>{label}</span>
            {i < steps.length - 1 && <span className="text-stone-300">→</span>}
          </li>
        ))}
      </ol>

      {err && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      {step === 1 && (
        <Card className="mt-6 p-6">
          <Field label={L === "es" ? "URL del repositorio" : "Repository URL"} required><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/owner/repository" /></Field>
          <div className="mt-4"><Button onClick={analyze} disabled={busy || !url.trim()}>{busy ? (L === "es" ? "Analizando…" : "Analyzing…") : (L === "es" ? "Analizar repositorio" : "Analyze repository")}</Button></div>
        </Card>
      )}

      {step === 2 && preview && (
        <>
          <Card className="mt-6 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-stone-900">{preview.owner}/{preview.name}</h2>
              <a href={preview.url} target="_blank" rel="noreferrer" className="text-sm text-accent-700 hover:underline">GitHub ↗</a>
            </div>
            {preview.description && <p className="mt-1 text-sm text-stone-600">{preview.description}</p>}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {[
                [L === "es" ? "Archivos" : "Files", String(preview.fileCount)],
                [L === "es" ? "Carpetas" : "Folders", String(preview.folderCount)],
                [L === "es" ? "Tamaño" : "Size", fmtSize(preview.sizeKb)],
                [L === "es" ? "Lenguaje" : "Language", preview.language || "—"],
                [L === "es" ? "Licencia" : "License", preview.license || "—"],
                [L === "es" ? "Última actualización" : "Last updated", preview.pushedAt ? new Date(preview.pushedAt).toLocaleDateString() : "—"]
              ].map(([k, v]) => (
                <div key={k}><dt className="text-stone-500">{k}</dt><dd className="font-medium text-stone-800">{v}</dd></div>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{L === "es" ? "Estructura" : "Structure"}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {preview.topLevel.map((t) => (
                  <li key={t.path} className="font-mono text-stone-700">{t.type === "tree" ? "📁" : "📄"} {t.path}</li>
                ))}
              </ul>
            </div>
          </Card>

          <Card className="mt-4 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={L === "es" ? "Título" : "Title"}><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
              <Field label={L === "es" ? "Tipo de proyecto" : "Project type"}>
                <Select value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                  {PROJECT_TYPES.map((pt) => <option key={pt.value} value={pt.value}>{pt.label[L]}</option>)}
                </Select>
              </Field>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>← {L === "es" ? "Atrás" : "Back"}</Button>
              <Button onClick={doImport} disabled={busy}>{busy ? (L === "es" ? "Importando…" : "Importing…") : (L === "es" ? "Importar repositorio" : "Import repository")}</Button>
            </div>
            <p className="mt-3 text-xs text-stone-400">{L === "es" ? "El repositorio original no se modifica. Se preservan la estructura y la atribución." : "The original repository is not modified. Structure and attribution are preserved."}</p>
          </Card>
        </>
      )}
    </div>
  );
}
