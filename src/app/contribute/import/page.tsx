"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Button, Input, Select, Field } from "@/components/ui";
import { Stepper } from "@/components/ui/visuals";
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
  if (loading || !user) return <div className="mx-auto max-w-3xl px-4 py-16 text-stone-500">{t("common.loading")}</div>;

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
      // Imported repositories become editable DRAFTS — open the draft editor so
      // the researcher can review/edit before submitting for review. Nothing is
      // published until an admin approves it.
      router.push(`/contribute?draft=${r.id}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  const steps = [L === "es" ? "Fuente" : "Source", L === "es" ? "Revisión" : "Review", L === "es" ? "Importar" : "Import", L === "es" ? "Completo" : "Complete"];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-stone-900">{L === "es" ? "Importar repositorio" : "Import Repository"}</h1>
      <p className="mt-3 max-w-2xl text-stone-600">{L === "es" ? "Pega la URL de un repositorio de GitHub. La plataforma analiza su estructura, genera un resumen científico y crea la página del proyecto — sin modificar el repositorio original." : "Paste a GitHub repository URL. The platform analyses its structure, generates a Scientific Overview and creates the project page — without modifying the original repository."}</p>

      <Stepper steps={steps} current={step} className="mt-6" />

      {err && <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}

      {step === 1 && (
        <Card className="mt-6 p-6">
          <Field label={L === "es" ? "URL del repositorio" : "Repository URL"} required><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/owner/repository" /></Field>
          <div className="mt-4"><Button onClick={analyze} disabled={busy || !url.trim()}>{busy ? (L === "es" ? "Analizando…" : "Analyzing…") : (L === "es" ? "Analizar repositorio" : "Analyze repository")}</Button></div>
        </Card>
      )}

      {step === 2 && preview && (
        <>
          <h2 className="mt-8 font-serif text-xl font-bold text-stone-900">{L === "es" ? "Revisar repositorio" : "Review repository"}</h2>
          <p className="mt-1 text-sm text-stone-500">{L === "es" ? "Encontramos la siguiente estructura en el repositorio:" : "We found the following structure in the repository:"}</p>
          <div className="mt-4 grid gap-5 md:grid-cols-[1.4fr_1fr]">
            {/* Tree */}
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-medium text-stone-700">{preview.owner}/{preview.name}</span>
                <a href={preview.url} target="_blank" rel="noreferrer" className="text-xs text-accent-700 hover:underline">GitHub ↗</a>
              </div>
              {preview.description && <p className="mt-1 text-sm text-stone-500">{preview.description}</p>}
              <div className="mt-4 rounded-lg bg-stone-50 p-3 font-mono text-sm text-stone-700">
                {preview.topLevel.map((n) => <p key={n.path}>{n.type === "tree" ? "📁" : "📄"} {n.path}{n.type === "tree" ? "/" : ""}</p>)}
              </div>
            </Card>
            {/* Repository information */}
            <Card className="h-fit p-5">
              <h3 className="text-sm font-semibold text-stone-700">{L === "es" ? "Información del repositorio" : "Repository information"}</h3>
              <dl className="mt-3 space-y-3 text-sm">
                {[
                  [L === "es" ? "Total de archivos" : "Total files", String(preview.fileCount)],
                  [L === "es" ? "Total de carpetas" : "Total folders", String(preview.folderCount)],
                  [L === "es" ? "Tamaño" : "Size", fmtSize(preview.sizeKb)],
                  [L === "es" ? "Lenguaje" : "Language", preview.language || "—"],
                  [L === "es" ? "Licencia" : "License", preview.license || "—"],
                  [L === "es" ? "Última actualización" : "Last updated", preview.pushedAt ? new Date(preview.pushedAt).toLocaleDateString() : "—"]
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-stone-100 pb-2 last:border-0"><dt className="text-stone-500">{k}</dt><dd className="font-medium text-stone-800">{v}</dd></div>
                ))}
              </dl>
            </Card>
          </div>

          <Card className="mt-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={L === "es" ? "Título" : "Title"}><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
              <Field label={L === "es" ? "Tipo de proyecto" : "Project type"}>
                <Select value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                  {PROJECT_TYPES.map((pt) => <option key={pt.value} value={pt.value}>{pt.label[L]}</option>)}
                </Select>
              </Field>
            </div>
            <p className="mt-3 text-xs text-stone-400">{L === "es" ? "El repositorio original no se modifica. La importación crea un borrador editable que revisas y envías a aprobación — nada se publica automáticamente." : "The original repository is not modified. Importing creates an editable draft that you review and submit for approval — nothing is published automatically."}</p>
          </Card>

          <div className="mt-5 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>← {L === "es" ? "Atrás" : "Back"}</Button>
            <Button onClick={doImport} disabled={busy}>{busy ? (L === "es" ? "Creando borrador…" : "Creating draft…") : (L === "es" ? "Importar y editar" : "Import & edit")}</Button>
          </div>
        </>
      )}
    </div>
  );
}
