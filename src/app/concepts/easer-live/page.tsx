"use client";
import { useState } from "react";
import { Card, Badge, Button } from "@/components/ui";

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT DEMO — NOT PRODUCTION.
// Isolated prototype of a possible future "EASER Live" scientific event hub.
// All content below is ILLUSTRATIVE / PLACEHOLDER. It does not represent real
// EASER analyses, does not touch Firestore or GitHub, and is not linked in the
// site navigation. It exists only to communicate the long-term product vision.
// ─────────────────────────────────────────────────────────────────────────────

const EVENT = {
  title: "M7.6 Offshore Earthquake — Example Event",
  magnitude: "7.6 Mw",
  date: "2025-XX-XX",
  location: "Subduction margin (example location)",
  summary:
    "An illustrative large subduction earthquake used to demonstrate how EASER could publish rapid, open scientific responses to major seismic events — for researchers and the public alike.",
  epicenter: "—°S, —°W (example)",
  depth: "28 km (example)",
  fault: "Interplate thrust (example)",
  tectonic: "Oceanic–continental subduction (example)",
  intensity: "Up to MMI VIII in nearby regions (example)",
  regions: ["Coastal region A", "Inland region B", "Metropolitan area C"]
};

function ConceptBanner() {
  return (
    <div className="border-b border-accent-200 bg-accent-50 px-4 py-2 text-center text-xs font-medium text-accent-800">
      Concept demo · Illustrative content only — not a real EASER analysis. Not connected to the repository.
    </div>
  );
}

function Section({ title, children, alt }: { title: string; children: React.ReactNode; alt?: boolean }) {
  return (
    <section className={alt ? "section-alt" : ""}>
      <div className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

const models = [
  { t: "Ground Motion", d: "Simulated intensity measures and shaking distribution.", icon: "〜" },
  { t: "Finite Element Models", d: "Structural archetypes under recorded motions.", icon: "▦" },
  { t: "Fragility Curves", d: "Damage probabilities by building typology.", icon: "📈" },
  { t: "Structural Response", d: "Nonlinear time-history response of key structures.", icon: "🏗" },
  { t: "Hazard Maps", d: "Updated, time-dependent hazard estimates.", icon: "🗺" }
];

const timeline = [
  "Earthquake occurs", "Rapid assessment", "First simulations", "Preliminary report",
  "Updated hazard maps", "Peer-reviewed publication", "Repository archive"
];

const resources = [
  "Research papers", "Government reports", "Open datasets", "Maps",
  "Satellite imagery", "Simulation outputs", "Educational resources"
];

const researchers = [
  { n: "Example Researcher A", r: "Seismic hazard", inst: "Example University" },
  { n: "Example Researcher B", r: "Structural engineering", inst: "Example University" },
  { n: "Example Researcher C", r: "Exposure & GIS", inst: "Example Institution" }
];

export default function EaserLiveConcept() {
  const [tab, setTab] = useState<"overview" | "summary">("overview");
  return (
    <div>
      <ConceptBanner />

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(230,180,85,0.5), transparent 45%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-20">
          <Badge color="amber">EASER Live · Concept</Badge>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-bold leading-tight md:text-5xl">{EVENT.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-brand-50">
            <span><span className="font-semibold text-white">Magnitude:</span> {EVENT.magnitude}</span>
            <span><span className="font-semibold text-white">Date:</span> {EVENT.date}</span>
            <span><span className="font-semibold text-white">Location:</span> {EVENT.location}</span>
          </div>
          <p className="mt-5 max-w-2xl text-lg text-brand-50">{EVENT.summary}</p>
        </div>
        <div className="h-40 w-full bg-gradient-to-t from-brand-900/60 to-transparent" />
      </section>

      {/* OVERVIEW + MAP */}
      <Section title="Earthquake overview">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card className="p-6">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[["Epicenter", EVENT.epicenter], ["Depth", EVENT.depth], ["Fault type", EVENT.fault], ["Tectonic setting", EVENT.tectonic], ["Intensity", EVENT.intensity]].map(([k, v]) => (
                <div key={k}><dt className="text-stone-500">{k}</dt><dd className="font-medium text-stone-800">{v}</dd></div>
              ))}
            </dl>
            <div className="mt-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">Affected regions</p>
              <div className="mt-2 flex flex-wrap gap-1">{EVENT.regions.map((r) => <Badge key={r}>{r}</Badge>)}</div>
            </div>
          </Card>
          <Card className="flex min-h-[260px] items-center justify-center bg-brand-50 p-6 text-center">
            <div>
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-200 text-2xl">🗺</div>
              <p className="mt-3 font-medium text-brand-800">Interactive map</p>
              <p className="text-sm text-stone-500">Placeholder — epicenter, intensity contours and stations would render here.</p>
            </div>
          </Card>
        </div>
      </Section>

      {/* RESEARCH CONNECTIONS */}
      <Section title="EASER research connections" alt>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Related publications", "Repository projects", "Previous studies", "Research lines"].map((c) => (
            <Card key={c} className="cursor-pointer p-5 transition hover:shadow-card">
              <h3 className="font-serif font-semibold text-brand-800">{c}</h3>
              <p className="mt-1 text-sm text-stone-600">Example links into EASER research would appear here.</p>
              <span className="mt-3 inline-block text-sm text-accent-700">Explore →</span>
            </Card>
          ))}
        </div>
      </Section>

      {/* MODELS & SIMULATIONS */}
      <Section title="Models & simulations">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {models.map((m) => (
            <Card key={m.t} className="p-5">
              <div className="text-2xl">{m.icon}</div>
              <h3 className="mt-2 font-serif font-semibold text-stone-900">{m.t}</h3>
              <p className="mt-1 text-sm text-stone-600">{m.d}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                {["View", "Run Simulation", "Documentation", "Download Results"].map((a) => (
                  <button key={a} className="rounded-lg border border-stone-300 px-2.5 py-1 text-stone-600 hover:bg-stone-100" onClick={(e) => e.preventDefault()}>{a}</button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-stone-400">Placeholder actions — illustrative only.</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* AI SUMMARY */}
      <Section title="AI scientific summary" alt>
        <Card className="p-6">
          <Badge color="amber">Example AI-generated content</Badge>
          <div className="prose-easer mt-3 max-w-none text-stone-700">
            <p>This example summary illustrates how an automatically generated, plain-language briefing could explain a major earthquake to both engineers and the informed public.</p>
            <p>A large interplate thrust event of this size releases energy along the subduction interface. Near-field structures experience strong, long-duration shaking; older or previously damaged buildings are most vulnerable. Time-dependent hazard models help anticipate aftershock sequences and evolving risk, while exposure data clarify which communities are most affected.</p>
            <p><strong>Why it matters:</strong> rapid, transparent scientific communication supports emergency response, retrofitting decisions and public preparedness.</p>
          </div>
          <p className="mt-2 text-xs text-stone-400">Illustrative text — not a real EASER analysis.</p>
        </Card>
      </Section>

      {/* TIMELINE */}
      <Section title="From event to archive">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {timeline.map((step, i) => (
            <li key={step} className="flex items-start gap-2 rounded-lg border border-stone-200 bg-white p-3 text-sm">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">{i + 1}</span>
              <span className="text-stone-700">{step}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* RESOURCES */}
      <Section title="Resources" alt>
        <div className="flex flex-wrap gap-2">
          {resources.map((r) => (
            <span key={r} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700">{r} <span className="text-xs text-stone-400">(placeholder)</span></span>
          ))}
        </div>
      </Section>

      {/* RESEARCHERS */}
      <Section title="Researchers involved">
        <div className="grid gap-4 sm:grid-cols-3">
          {researchers.map((p) => (
            <Card key={p.n} className="flex items-center gap-3 p-4">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-700 text-sm font-semibold text-white">{p.n.split(" ").slice(-1)[0][0]}</span>
              <div><p className="font-medium text-stone-900">{p.n}</p><p className="text-xs text-stone-500">{p.r} · {p.inst}</p></div>
            </Card>
          ))}
        </div>
        <p className="mt-2 text-xs text-stone-400">Placeholder contributors.</p>
      </Section>

      {/* RELATED NEWS */}
      <Section title="Related news" alt>
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5">
              <Badge>Sample</Badge>
              <h3 className="mt-2 font-serif font-semibold text-stone-900">Example update #{i}</h3>
              <p className="mt-1 text-sm text-stone-600">Illustrative news item showing how rapid updates could be linked to an event.</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* EDUCATIONAL */}
      <Section title="What can we learn from this earthquake?">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Tectonics", "How subduction builds and releases stress over time."],
            ["Structural engineering", "Why certain building types perform better."],
            ["Risk", "How hazard, vulnerability and exposure combine."],
            ["Preparedness", "Steps communities can take before events."],
            ["Lessons learned", "What this event teaches for future resilience."]
          ].map(([t, d]) => (
            <Card key={t} className="p-5"><h3 className="font-serif font-semibold text-brand-800">{t}</h3><p className="mt-1 text-sm text-stone-600">{d}</p></Card>
          ))}
        </div>
      </Section>

      <div className="border-t border-stone-200 bg-stone-50 px-4 py-8 text-center text-xs text-stone-400">
        EASER Live — design concept. All content is illustrative and for demonstration only.
      </div>
    </div>
  );
}
