import Link from "next/link";
import { LinkButton, Card } from "@/components/ui";
import { APP_NAME, PARTNERS, CATEGORIES } from "@/lib/constants";

const steps = [
  { n: "1", t: "Submit", d: "Fill a short form describing your work and attach files. No Git required." },
  { n: "2", t: "Describe", d: "Answer a few guided questions about your contribution." },
  { n: "3", t: "Auto-document", d: "The platform drafts professional documentation for you." },
  { n: "4", t: "Review", d: "The project curator reviews and refines before anything is published." },
  { n: "5", t: "Publish", d: "Approved work is committed to the GitHub repository — the source of truth." }
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-700 to-brand-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-brand-100">
            {PARTNERS.join(" · ")}
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-5xl">
            Contribute to the EASER research repository — without touching Git.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-brand-50">
            {APP_NAME} gives researchers a professional web interface to submit models, datasets,
            GIS layers, reports and code. GitHub stays the central source of truth; we handle the rest.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/contribute" variant="secondary" className="!bg-white !text-brand-700">
              Submit a contribution
            </LinkButton>
            <Link href="/browse" className="inline-flex items-center rounded-lg border border-white/40 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
              Browse the repository
            </Link>
          </div>
        </div>
      </section>

      {/* What it is */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900">About EASER</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          EASER is a multi-institutional research initiative spanning public-sector and academic
          organizations including {PARTNERS.join(", ")}. The repository collects computational models,
          scientific datasets, GIS and spatial information, research reports, documentation, scripts and
          technical resources. This hub lowers the barrier to contributing while preserving rigorous,
          curated version control on GitHub.
        </p>
      </section>

      {/* How it works */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-slate-900">How contributing works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-5">
            {steps.map((s) => (
              <Card key={s.n} className="p-5">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">{s.n}</div>
                <h3 className="mt-3 font-semibold text-slate-900">{s.t}</h3>
                <p className="mt-1 text-sm text-slate-600">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-slate-900">What you can contribute</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <Card key={c.value} className="p-5">
              <h3 className="font-semibold text-brand-700">{c.label}</h3>
              <p className="mt-1 text-sm text-slate-600">{c.description}</p>
            </Card>
          ))}
        </div>
        <div className="mt-10 rounded-xl bg-brand-50 p-6 text-center">
          <p className="text-lg font-medium text-brand-800">Ready to add your work to EASER?</p>
          <div className="mt-4"><LinkButton href="/contribute">Start a contribution</LinkButton></div>
        </div>
      </section>
    </>
  );
}
