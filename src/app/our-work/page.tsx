"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, LinkButton } from "@/components/ui";
import { ProjectCard } from "@/components/project/ProjectCard";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import type { RegistryRecord } from "@/lib/types";

// "Our Work" is the public face of the open repository. It routes users into the
// existing, unchanged repository routes (browse / search / docs / contribute).
export default function OurWorkPage() {
  const { lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const [projects, setProjects] = useState<RegistryRecord[]>([]);
  useEffect(() => { apiGet<RegistryRecord[]>("/api/registry").then(setProjects).catch(() => {}); }, []);

  const tiles = [
    { href: "/browse", en: "Browse projects", es: "Explorar proyectos", den: "Explore published research projects and their resources.", des: "Explora los proyectos de investigación publicados y sus recursos." },
    { href: "/search", en: "Search", es: "Buscar", den: "Search projects by author, institution, category and keywords.", des: "Busca proyectos por autor, institución, categoría y palabras clave." },
    { href: "/docs", en: "Documentation", es: "Documentación", den: "Auto-generated, curator-reviewed documentation for each project.", des: "Documentación generada automáticamente y revisada por curadores." },
    { href: "/contribute", en: "Contribute", es: "Contribuir", den: "Researchers can submit datasets, models, reports and more.", des: "Los investigadores pueden enviar datos, modelos, informes y más." }
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">{L === "es" ? "Nuestro trabajo" : "Our Work"}</h1>
      <p className="mt-2 max-w-3xl text-stone-600">
        {L === "es"
          ? "EASER es una plataforma de ciencia abierta. Todos los modelos, datos y resultados se publican en un repositorio público y citable."
          : "EASER is an open-science platform. All models, data and outputs are published in a public, citable research repository."}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href}>
            <Card className="flex h-full flex-col p-5 transition hover:shadow-card">
              <h2 className="font-serif font-semibold text-brand-800">{L === "es" ? t.es : t.en}</h2>
              <p className="mt-1 text-sm text-stone-600">{L === "es" ? t.des : t.den}</p>
              <span className="mt-auto pt-3 text-sm text-accent-700">{L === "es" ? "Abrir" : "Open"} →</span>
            </Card>
          </Link>
        ))}
      </div>

      {projects.length > 0 && (
        <section className="mt-14">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold text-stone-900">{L === "es" ? "Proyectos publicados" : "Published projects"}</h2>
            <LinkButton href="/browse" variant="secondary">{L === "es" ? "Ver todos" : "View all"}</LinkButton>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.slice(0, 6).map((r) => <ProjectCard key={r.id} r={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
