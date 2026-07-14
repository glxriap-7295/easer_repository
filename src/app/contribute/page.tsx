"use client";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RepoBuilder } from "@/components/project/RepoBuilder";
import { ProjectWizard } from "@/components/project/ProjectWizard";
import { useT } from "@/components/i18n/LanguageProvider";

function ContributeInner() {
  const { t, lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const params = useSearchParams();
  const draft = params.get("draft") || undefined;
  const advanced = params.get("mode") === "form";

  // Resuming a saved draft, or "Advanced mode" → the guided form.
  if (draft || advanced) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-stone-900">{draft ? (L === "es" ? "Editar proyecto" : "Edit project") : (L === "es" ? "Formulario guiado" : "Guided form")}</h1>
        <p className="mt-2 text-stone-600">{t("contribute.intro")}</p>
        {!draft && <Link href="/contribute" className="mt-2 inline-block text-sm text-accent-700 hover:underline">← {L === "es" ? "Volver al constructor de repositorio" : "Back to the repository builder"}</Link>}
        <div className="mt-8"><ProjectWizard projectId={draft} /></div>
      </div>
    );
  }

  // Default contribution experience: the visual Repository Builder.
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">{L === "es" ? "Contribuir un proyecto" : "Contribute a project"}</h1>
      <p className="mt-2 text-stone-600">{L === "es" ? "Organiza tu investigación como un repositorio. Diseña las carpetas, arrastra tus archivos y envía — el equipo EASER lo revisa y la plataforma crea el repositorio automáticamente." : "Organize your research as a repository. Design the folders, drop in your files, and submit — the EASER team reviews it and the platform creates the repository automatically."}</p>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/contribute/import" className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-700 hover:bg-stone-100">{L === "es" ? "Importar repositorio existente" : "Import existing repository"}</Link>
      </div>

      <div className="mt-8"><RepoBuilder /></div>
    </div>
  );
}

export default function ContributePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-12 text-stone-500">…</div>}>
      <ContributeInner />
    </Suspense>
  );
}
