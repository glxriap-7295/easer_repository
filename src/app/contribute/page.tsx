"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProjectWizard } from "@/components/project/ProjectWizard";

function ContributeInner() {
  const params = useSearchParams();
  const draft = params.get("draft") || undefined;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">{draft ? "Edit project" : "Contribute a project"}</h1>
      <p className="mt-2 text-stone-600">
        One project, many files. Add your authors and institutions, upload your files, and submit —
        a curator reviews everything and the platform writes the documentation. No Git required.
      </p>
      <div className="mt-8"><ProjectWizard projectId={draft} /></div>
    </div>
  );
}

export default function ContributePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-12 text-stone-500">Loading…</div>}>
      <ContributeInner />
    </Suspense>
  );
}
