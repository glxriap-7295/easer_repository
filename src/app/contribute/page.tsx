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
      <div className="mt-8"><ProjectWizard projectId={draft} /></div>
    </div>
  );
}

export default function ContributePage() {
  return <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-12 text-stone-500">…</div>}><ContributeInner /></Suspense>;
}
