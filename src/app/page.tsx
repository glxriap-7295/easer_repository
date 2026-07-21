"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { CategoryVisual, HeroScene, AnimatedCount } from "@/components/ui/visuals";
import { PartnerLogos } from "@/components/InstitutionLogo";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import { EASER_TAGLINE, EASER_ABSTRACT, projectTypeLabel } from "@/lib/constants";
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
  const [heroImgOk, setHeroImgOk] = useState(true);

  useEffect(() => {
    apiGet<ProjectCardData[]>("/api/public/projects").then(setProjects).catch(() => {});
    apiGet<NewsPost[]>("/api/news").then(setNews).catch(() => {});
    apiGet<Stats>("/api/public/stats").then(setStats).catch(() => {});
  }, []);

  const featured = projects.slice(0, 3);
  const latestNews = news.filter((n) => n.kind !== "event").slice(0, 3);
  const activity = [
    { label: L === "es" ? "Proyectos" : "Projects", value: stats?.projects },
    { label: L === "es" ? "Contribuidores" : "Contributors", value: stats?.researchers },
    { label: L === "es" ? "Conjuntos de datos" : "Datasets", value: stats?.datasets },
    { label: L === "es" ? "Herramientas computacionales" : "Computational Tools", value: stats?.models },
    { label: L === "es" ? "Publicaciones" : "Publications", value: stats?.publications }
  ];

  const purpose = [
    {
      eyebrow: L === "es" ? "Nuestro propósito" : "Our purpose",
      heading: L === "es" ? "Ciencia para comunidades más resilientes" : "Science for more resilient communities",
      body: ""
    },
    {
      eyebrow: L === "es" ? "Nuestro enfoque" : "Our approach",
      heading: "",
      body: L === "es"
        ? "Estudiamos, comprendemos y comunicamos el riesgo sísmico para apoyar decisiones informadas y salvar vidas."
        : "We study, understand and communicate seismic risk to support informed decisions and save lives."
    },
    {
      eyebrow: L === "es" ? "Colabora con EASER" : "Collaborate with EASER",
      heading: "",
      body: L === "es"
        ? "Sé parte de nuestra red de investigadores, estudiantes e instituciones comprometidas con la reducción del riesgo sísmico."
        : "Be part of our network of researchers, students and institutions committed to reducing seismic risk."
    }
  ];

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden text-white">
        {/* Layer 1: SVG fallback (only if the photo fails to load) */}
        <HeroScene />
        {/* Layer 2: earthquake-response photograph — optimized & preloaded.
            `priority` emits <link rel="preload" as="image"> (good LCP). Focal point
            (the responders' interaction) is biased toward the right, away from text. */}
        {heroImgOk && (
          <Image
            src="/hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            quality={72}
            className="object-cover object-[62%_center] md:object-[70%_center]"
            style={{ filter: "brightness(0.96)" }}
            onError={() => setHeroImgOk(false)}
          />
        )}
        {/* Layer 3: forest-green overlay (~60%) — heavier on the left for text legibility */}
        <div className="absolute inset-0" aria-hidden style={{ background: "linear-gradient(90deg, rgba(18,42,27,0.74) 0%, rgba(18,42,27,0.58) 55%, rgba(18,42,27,0.46) 100%)" }} />

        <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-24 md:grid-cols-[1.5fr_1fr] md:py-28">
          <div className="animate-fadeup">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-200">
              {L === "es" ? "Investigación para un Chile resiliente" : "Research for a resilient Chile"}
            </p>
            <h1 className="mt-4 max-w-2xl font-serif text-4xl font-bold leading-[1.1] text-white md:text-5xl">{EASER_TAGLINE[L]}</h1>
            <p className="mt-5 max-w-xl text-lg text-stone-100">
              {L === "es"
                ? "Plataforma de investigación y difusión científica del Proyecto Anillo EASER."
                : "Research and scientific dissemination platform of the EASER Anillo Project."}
            </p>
            <div className="mt-6 h-1 w-16 rounded bg-accent-400" />
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/browse" className="rounded-lg bg-accent-400 px-6 py-3 text-center text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-accent-300">
                {L === "es" ? "Explorar proyectos" : "Explore projects"}
              </Link>
              <Link href="/our-work" className="rounded-lg border border-accent-300/80 px-6 py-3 text-center text-sm font-semibold text-accent-100 transition hover:bg-accent-300/10">
                {L === "es" ? "Conocer nuestro trabajo" : "Learn about our work"}
              </Link>
            </div>
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

      {/* ── PURPOSE CARDS ────────────────────────────────────────────────── */}
      <section className="section-alt">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-5 md:grid-cols-3">
            {purpose.map((c) => (
              <Card key={c.eyebrow} className="p-7">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">{c.eyebrow}</p>
                {c.heading
                  ? <h2 className="mt-3 font-serif text-2xl font-bold leading-snug text-stone-900">{c.heading}</h2>
                  : <p className="mt-3 text-stone-700">{c.body}</p>}
                <div className="mt-6 h-1 w-10 rounded bg-accent-400" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── LATEST NEWS ──────────────────────────────────────────────────── */}
      {latestNews.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
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
