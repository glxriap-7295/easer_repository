"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Button, Input, Select, Field } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiPost } from "@/lib/client";
import { PROJECT_TYPES } from "@/lib/constants";

export default function ImportPage() {
  const { user, loading } = useAuth();
  const { t, lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [projectType, setProjectType] = useState("research");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { if (!loading && !user) router.replace("/login?next=/contribute/import"); }, [loading, user, router]);
  if (loading || !user) return <div className="mx-auto max-w-2xl px-4 py-16 text-stone-500">{t("common.loading")}</div>;

  async function importRepo() {
    setErr(""); setBusy(true);
    try {
      const r = await apiPost<{ id: string }>("/api/projects/import", { url, title: title || undefined, projectType }, true);
      router.push(`/projects/${r.id}`);
    } catch (e: any) { setErr(e.message); setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">{L === "es" ? "Importar repositorio existente" : "Import existing repository"}</h1>
      <p className="mt-2 text-stone-600">{L === "es" ? "Pega la URL de un repositorio de GitHub. La plataforma analiza su estructura, genera un resumen científico y crea la página del proyecto — sin modificar el repositorio original." : "Paste a GitHub repository URL. The platform analyses its structure, generates a Scientific Overview and creates the project page — without modifying the original repository."}</p>

      <Card className="mt-8 p-6">
        {err && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</div>}
        <div className="grid gap-4">
          <Field label={L === "es" ? "URL del repositorio" : "Repository URL"} required><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://github.com/owner/repository" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={L === "es" ? "Título (opcional)" : "Title (optional)"}><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={L === "es" ? "Se usa el nombre del repo si se deja vacío" : "Repo name is used if left empty"} /></Field>
            <Field label={L === "es" ? "Tipo de proyecto" : "Project type"}>
              <Select value={projectType} onChange={(e) => setProjectType(e.target.value)}>
                {PROJECT_TYPES.map((pt) => <option key={pt.value} value={pt.value}>{pt.label[L]}</option>)}
              </Select>
            </Field>
          </div>
          <div><Button onClick={importRepo} disabled={busy || !url.trim()}>{busy ? (L === "es" ? "Importando…" : "Importing…") : (L === "es" ? "Importar" : "Import")}</Button></div>
        </div>
        <p className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-400">{L === "es" ? "El repositorio original no se modifica. Se preservan la estructura y la atribución." : "The original repository is not modified. Structure and attribution are preserved."}</p>
      </Card>
    </div>
  );
}
