"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LinkButton, Card, Badge } from "@/components/ui";
import { ProjectCard } from "@/components/project/ProjectCard";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import {
  INSTITUTION_ORDER, EASER_TAGLINE, EASER_ABSTRACT, RESEARCH_THEMES,
  EASER_OBJECTIVES, STUDY_AREAS, EASER_INFO
} from "@/lib/constants";
import type { RegistryRecord, NewsPost } from "@/lib/types";

interface Stats { projects: number; researchers: number; datasets: number; models: number; publications: number; }

export default function Home() {
  const { lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const [projects, setProjects] = useState<RegistryRecord[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiGet<RegistryRecord[]>("/api/registry").then(setProjects).catch(() => {});
    apiGet<NewsPost[]>("/api/news").then(setNews).catch(() => {});
    apiGet<Stats>("/api/public/stats").then(setStats).catch(() => {});
  }, []);

  const featured = projects.slice(0, 3);
  const latestNews = news.slice(0, 3);
  const impact = [
    { label: L === "es" ? "Proyectos" : "Projects", value: stats?.projects },
    { label: L === "es" ? "Investigadores" : "Researchers", value: stats?.researchers },
    { label: L === "es" ? "Conjuntos de datos" : "Datasets", value: stats?.datasets },
    { label: L === "es" ? "Modelos" : "Models", value: stats?.models },
    { label: L === "es" ? "Publicaciones" : "Publications", value: stats?.publications }
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 78% 18%, rgba(230,180,85,0.55), transparent 45%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-24">
          <p className="text-sm font-semibold uppercase tracking-wide text-accent-200">{L === "es" ? "Investigación para un Chile resiliente" : "Research for a resilient Chile"}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-bold leading-tight md:text-5xl">{EASER_TAGLINE[L]}</h1>
          <p className="mt-5 max-w-2xl text-lg text-brand-50">{EASER_ABSTRACT[L]}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/our-work" variant="secondary" className="!bg-white !text-brand-800">{L === "es" ? "Explorar nuestro trabajo" : "Explore Our Work"}</LinkButton>
            <Link href="#about" className="inline-flex items-center rounded-lg border border-white/40 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">{L === "es" ? "Conocer EASER" : "Learn About EASER"}</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-sm text-brand-100">
            {STUDY_AREAS.map((c) => (
              <span key={c}><span className="font-semibold text-white">{c}</span> · {L === "es" ? "Área de estudio" : "Study area"}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">{EASER_INFO.aboutTitle[L]}</h2>
            <p className="mt-3 text-lg text-stone-700">{EASER_INFO.mission[L]}</p>
            <p className="mt-3 text-stone-600">{EASER_ABSTRACT[L]}</p>
            <p className="mt-3 text-sm text-stone-500">{EASER_INFO.name} · {L === "es" ? "Iniciativa financiada por ANID" : "ANID-funded initiative"}</p>
          </div>
          <Card className="p-6">
            <h3 className="font-serif text-lg font-semibold text-brand-800">{L === "es" ? "Objetivos" : "Objectives"}</h3>
            <ol className="mt-3 space-y-2 text-sm text-stone-700">
              {EASER_OBJECTIVES.map((o, i) => (
                <li key={i} className="flex gap-2"><span className="font-bold text-accent-600">{i + 1}.</span><span>{o[L]}</span></li>
              ))}
            </ol>
          </Card>
        </div>
      </section>

      {/* RESEARCH THEMES */}
      <section className="section-alt">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-stone-900">{L === "es" ? "Líneas de investigación" : "Research themes"}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RESEARCH_THEMES.map((th, i) => (
              <Card key={i} className="p-5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 font-bold text-brand-800">{i + 1}</span>
                <h3 className="mt-3 font-serif font-semibold text-stone-900">{th.title[L]}</h3>
                <p className="mt-1 text-sm text-stone-600">{th.desc[L]}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* IMPACT */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-stone-900">{L === "es" ? "Impacto" : "Impact"}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {impact.map((m) => (
            <Card key={m.label} className="p-5 text-center">
              <p className="font-serif text-3xl font-bold text-brand-700">{m.value ?? "—"}</p>
              <p className="mt-1 text-sm text-stone-600">{m.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      {featured.length > 0 && (
        <section className="section-alt">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="flex items-end justify-between">
              <h2 className="text-2xl font-bold text-stone-900">{L === "es" ? "Proyectos destacados" : "Featured projects"}</h2>
              <Link href="/our-work" className="text-sm text-accent-700 hover:underline">{L === "es" ? "Ver todo" : "View all"} →</Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">{featured.map((r) => <ProjectCard key={r.id} r={r} />)}</div>
          </div>
        </section>
      )}

      {/* NEWS PREVIEW */}
      {latestNews.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-stone-900">{L === "es" ? "Últimas noticias" : "Latest news"}</h2>
            <Link href="/news" className="text-sm text-accent-700 hover:underline">{L === "es" ? "Ver todas" : "View all"} →</Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {latestNews.map((n) => (
              <Link key={n.id} href={`/news/${n.slug}`}>
                <Card className="flex h-full flex-col overflow-hidden transition hover:shadow-card">
                  {n.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={n.coverImage} alt="" className="h-36 w-full object-cover" />
                  )}
                  <div className="p-5">
                    {n.pinned && <Badge color="amber">Featured</Badge>}
                    <h3 className="mt-1 font-serif font-semibold text-stone-900">{n.title}</h3>
                    {n.subtitle && <p className="mt-1 text-sm text-stone-600 line-clamp-2">{n.subtitle}</p>}
                    <p className="mt-2 text-xs text-stone-400">{n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : ""}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* PARTNERS */}
      <section className="section-alt">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-stone-900">{L === "es" ? "Instituciones participantes" : "Participating institutions"}</h2>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {INSTITUTION_ORDER.map((inst) => (
              <Card key={inst.canonical} className="flex items-center justify-center p-4 text-center">
                <span className="text-sm font-medium text-stone-700">{inst.short}</span>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-xs text-stone-500">{INSTITUTION_ORDER.map((i) => i.canonical).join(" · ")}</p>
        </div>
      </section>
    </>
  );
}
