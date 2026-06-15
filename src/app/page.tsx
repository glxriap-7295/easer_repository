"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LinkButton, Card } from "@/components/ui";
import { ProjectCard } from "@/components/project/ProjectCard";
import { PARTNERS, CATEGORIES, EASER_INFO } from "@/lib/constants";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import type { RegistryRecord } from "@/lib/types";

export default function Home() {
  const { t, lang } = useT();
  const [items, setItems] = useState<RegistryRecord[]>([]);
  useEffect(() => { apiGet<RegistryRecord[]>("/api/registry").then(setItems).catch(() => setItems([])); }, []);

  const featured = items.slice(0, 3);
  const recent = items.slice(3, 9);
  const L = lang === "es" ? "es" : "en";

  return (
    <>
      {/* Hero — geoscience teal */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "radial-gradient(circle at 80% 20%, rgba(230,180,85,0.5), transparent 45%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-20">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/easer-logo.svg" alt="EASER" width={56} height={56} className="h-14 w-14" />
            <p className="text-sm font-medium uppercase tracking-wide text-accent-200">{PARTNERS.join(" · ")}</p>
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">{t("home.heroTitle")}</h1>
          <p className="mt-5 max-w-2xl text-lg text-brand-50">{t("home.heroSubtitle")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/contribute" variant="secondary" className="!bg-white !text-brand-800">{t("home.submitCta")}</LinkButton>
            <Link href="/browse" className="inline-flex items-center rounded-lg border border-white/40 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">{t("home.browseCta")}</Link>
          </div>
        </div>
      </section>

      {/* About the EASER project (official) */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-stone-900">{EASER_INFO.aboutTitle[L]}</h2>
        <p className="mt-3 max-w-3xl text-lg text-stone-700">{EASER_INFO.mission[L]}</p>
        <p className="mt-2 text-sm text-stone-500">{EASER_INFO.name} · {EASER_INFO.location}</p>

        <h3 className="mt-8 font-serif text-lg font-semibold text-brand-800">{EASER_INFO.linesTitle[L]}</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {EASER_INFO.lines.map((line, i) => (
            <Card key={i} className="flex items-start gap-3 p-4">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-100 text-sm font-bold text-accent-700">{i + 1}</span>
              <p className="text-sm text-stone-700">{line[L]}</p>
            </Card>
          ))}
        </div>
        <div className="mt-6">
          <a href={EASER_INFO.official} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent-700 hover:underline">
            {EASER_INFO.officialCta[L]} →
          </a>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section-alt">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold text-stone-900">{t("home.featuredTitle")}</h2>
              <Link href="/search" className="text-sm text-accent-700 hover:underline">{t("common.search")} →</Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">{featured.map((r) => <ProjectCard key={r.id} r={r} />)}</div>
          </div>
        </section>
      )}

      {recent.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-stone-900">{t("home.recentTitle")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{recent.map((r) => <ProjectCard key={r.id} r={r} />)}</div>
        </section>
      )}

      {/* What you can contribute */}
      <section className={`${featured.length > 0 ? "section-alt" : ""}`}>
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-stone-900">{t("home.categoriesTitle")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <Card key={c.value} className="p-5">
                <h3 className="font-semibold text-brand-800">{c.label}</h3>
                <p className="mt-1 text-sm text-stone-600">{c.description}</p>
              </Card>
            ))}
          </div>
          <div className="mt-10 rounded-xl bg-brand-100 p-6 text-center">
            <p className="text-lg font-medium text-brand-900">{t("home.readyTitle")}</p>
            <div className="mt-4"><LinkButton href="/contribute">{t("home.submitCta")}</LinkButton></div>
          </div>
        </div>
      </section>
    </>
  );
}
