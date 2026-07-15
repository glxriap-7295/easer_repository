"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { CategoryVisual, HeroScene, AnimatedCount } from "@/components/ui/visuals";
import { PartnerLogos } from "@/components/InstitutionLogo";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import { EASER_TAGLINE, EASER_ABSTRACT, STUDY_AREAS, projectTypeLabel } from "@/lib/constants";
import type { NewsPost } from "@/lib/types";

interface Stats { projects: number; researchers: number; datasets: number; models: number; publications: number; }
interface ProjectCardData {
  id: string; title: string; description: string; authors: string[]; institutions: string[];
  keywords: string[]; projectType?: string; year: number;
}

export default function Home() {
  const { lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [news, setNews] = useState<NewsPost[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiGet<ProjectCardData[]>("/api/public/projects").then(setProjects).catch(() => {});
    apiGet<NewsPost[]>("/api/news").then(setNews).catch(() => {});
    apiGet<Stats>("/api/public/stats").then(setStats).catch(() => {});
  }, []);

  const featured = projects.slice(0, 3);
  const latestNews = news.slice(0, 3);
  const activity = [
    { label: L === "es" ? "Proyectos" : "Projects", value: stats?.projects },
    { label: L === "es" ? "Contribuidores" : "Contributors", value: stats?.researchers },
    { label: L === "es" ? "Conjuntos de datos" : "Datasets", value: stats?.datasets },
    { label: L === "es" ? "Herramientas computacionales" : "Computational Tools", value: stats?.models },
    { label: L === "es" ? "Publicaciones" : "Publications", value: stats?.publications }
  ];

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white">
        <HeroScene />
        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-24 md:grid-cols-[1.5fr_1fr] md:py-28">
          <div className="animate-[fadeup_0.7s_ease-out]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-200">
              {L === "es" ? "Investigación para un Chile resiliente" : "Research for a resilient Chile"}
            </p>
            <h1 className="mt-4 max-w-2xl font-serif text-4xl font-bold leading-[1.1] md:text-5xl">{EASER_TAGLINE[L]}</h1>
            <p className="mt-5 max-w-xl text-lg text-brand-50/90">
              {L === "es"
                ? "Explora datos, modelos, herramientas y publicaciones de la iniciativa de investigación EASER."
                : "Explore data, models, tools and publications from the EASER research initiative."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/browse" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500">
                {L === "es" ? "Explorar proyectos" : "Explore projects"}
              </Link>
              <Link href="/our-work" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 shadow-sm transition hover:bg-stone-100">
                {L === "es" ? "Conocer más" : "Learn more"}
              </Link>
            </div>
          </div>

          {/* Study-area pins */}
          <div className="hidden flex-col justify-center gap-4 md:flex">
            {STUDY_AREAS.map((c, i) => (
              <div key={c} className="flex items-center gap-3" style={{ marginLeft: `${i * 28}px` }}>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-400/90 text-brand-900 shadow-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
                </span>
                <span className="font-serif text-lg text-white">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCIENTIFIC ACTIVITY ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-stone-900">{L === "es" ? "Actividad científica" : "Scientific Activity"}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {activity.map((m) => (
            <Card key={m.label} className="p-6 text-center transition hover:-translate-y-0.5 hover:shadow-card">
              <p className="font-serif text-4xl font-bold text-brand-700"><AnimatedCount value={m.value} /></p>
              <p className="mt-2 text-sm text-stone-600">{m.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── LATEST NEWS ──────────────────────────────────────────────────── */}
      {latestNews.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-4">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-stone-900">{L === "es" ? "Últimas noticias" : "Latest news"}</h2>
            <Link href="/news" className="text-sm font-medium text-accent-700 hover:underline">{L === "es" ? "Ver todas las noticias" : "View all news"} →</Link>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {latestNews.map((n) => (
              <Link key={n.id} href={`/news/${n.slug}`} className="group">
                <Card className="flex h-full flex-col overflow-hidden transition group-hover:-translate-y-0.5 group-hover:shadow-card">
                  {n.coverImage
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={n.coverImage} alt="" className="h-40 w-full object-cover" />
                    : <CategoryVisual seed={n.id} rounded="rounded-none" className="h-40 w-full" />}
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-700">
                      {(n.tags?.[0] || (L === "es" ? "Noticia" : "News"))} · {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : ""}
                    </p>
                    <h3 className="mt-1 font-serif font-semibold text-stone-900 group-hover:text-brand-800">{n.title}</h3>
                    {n.subtitle && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{n.subtitle}</p>}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── FEATURED RESEARCH ────────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-stone-900">{L === "es" ? "Investigación destacada" : "Featured Research"}</h2>
            <Link href="/browse" className="text-sm font-medium text-accent-700 hover:underline">{L === "es" ? "Ver todos los proyectos" : "View all projects"} →</Link>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {featured.map((r) => (
              <Link key={r.id} href={`/projects/${r.id}`} className="group">
                <Card className="flex h-full flex-col overflow-hidden transition group-hover:-translate-y-0.5 group-hover:shadow-card">
                  <CategoryVisual seed={r.id} rounded="rounded-none" className="h-44 w-full" />
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-700">{projectTypeLabel(r.projectType, L)}</p>
                    <h3 className="mt-1 font-serif text-lg font-semibold text-stone-900 group-hover:text-brand-800">{r.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600">{r.description}</p>
                    <div className="mt-auto pt-3 text-xs text-stone-500">
                      {r.institutions[0] && <p className="truncate">{r.institutions[0]}</p>}
                      {r.authors[0] && <p className="truncate">{L === "es" ? "Investigador principal" : "Principal Investigator"}: {r.authors[0]}</p>}
                    </div>
                    <span className="mt-3 inline-block text-sm font-medium text-brand-700 group-hover:underline">{L === "es" ? "Abrir proyecto" : "Open project"} →</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── PARTICIPATING INSTITUTIONS ───────────────────────────────────── */}
      <section className="section-alt">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-stone-900">{L === "es" ? "Instituciones participantes" : "Participating Institutions"}</h2>
          <p className="mt-2 max-w-2xl text-stone-600">{EASER_ABSTRACT[L]}</p>
          <PartnerLogos className="mt-8" />
        </div>
      </section>
    </>
  );
}
