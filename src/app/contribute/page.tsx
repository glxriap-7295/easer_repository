"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectWizard } from "@/components/project/ProjectWizard";
import { useT } from "@/components/i18n/LanguageProvider";

function ContributeInner() {
  const { t } = useT();
  const params = useSearchParams();
  const draft = params.get("draft") || undefined;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">{draft ? t("contribute.titleEdit") : t("contribute.titleNew")}</h1>
      <p className="mt-2 text-stone-600">{t("contribute.intro")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <a href="/contribute/build" className="rounded-lg border border-stone-200 bg-white p-4 text-sm transition hover:shadow-card"><span className="font-serif font-semibold text-brand-800">{t("common.contribute") === "Contribute" ? "Repository builder" : "Constructor de repositorio"}</span><p className="mt-1 text-stone-600">Build your repository structure visually.</p></a>
        <a href="/contribute/import" className="rounded-lg border border-stone-200 bg-white p-4 text-sm transition hover:shadow-card"><span className="font-serif font-semibold text-brand-800">Import existing repository</span><p className="mt-1 text-stone-600">Already have a GitHub repo? Import it.</p></a>
      </div>
      <p className="mt-6 text-sm font-medium text-stone-500">Or use the guided form:</p>
      <div className="mt-2"><ProjectWizard projectId={draft} /></div>
    </div>
  );
}

export default function ContributePage() {
  return <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-12 text-stone-500">…</div>}><ContributeInner /></Suspense>;
}
