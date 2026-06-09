import { ContributionWizard } from "@/components/contribute/ContributionWizard";

export const metadata = { title: "Contribute · EASER Data Hub" };

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Contribute to EASER</h1>
      <p className="mt-2 text-slate-600">
        Share your research artifact in a few steps. You don't need to know Git — we generate the
        documentation and a curator publishes it to the repository.
      </p>
      <div className="mt-8"><ContributionWizard /></div>
    </div>
  );
}
