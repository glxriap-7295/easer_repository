"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { CategoryVisual } from "@/components/ui/visuals";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import { PROJECT_TYPES, projectTypeLabel } from "@/lib/constants";

interface ProjectCardData {
  id: string; title: string; description: string; projectType?: string;
  authors: string[]; institutions: string[]; keywords: string[];
  version: number; fileCount: number; year: number; publishedAt?: string;
}

const PER_PAGE = 9;

export default function BrowsePage() {
  const { lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [institution, setInstitution] = useState("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "az">("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  useEffect(() => { apiGet<ProjectCardData[]>("/api/public/projects").then(setProjects).catch(() => setProjects([])).finally(() => setLoading(false)); }, []);

  const institutions = useMemo(() => Array.from(new Set(projects.flatMap((p) => p.institutions))).sort(), [projects]);

  const filtered = useMemo(() => {
    let rows = projects.filter((p) => {
      if (type !== "all" && (p.projectType || "research") !== type) return false;
      if (institution !== "all" && !p.institutions.includes(institution)) return false;
      if (q.trim()) {
        const hay = `${p.title} ${p.description} ${p.authors.join(" ")} ${p.keywords.join(" ")}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    rows = [...rows].sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      const da = a.publishedAt || String(a.year), db = b.publishedAt || String(b.year);
      return sort === "newest" ? db.localeCompare(da) : da.localeCompare(db);
    });
    return rows;
  }, [projects, q, type, institution, sort]);

  useEffect(() => { setPage(1); }, [q, type, institution, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const shown = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const selectCls = "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-stone-900">{L === "es" ? "Proyectos" : "Projects"}</h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        {L === "es"
          ? "Explora proyectos de investigación, conjuntos de datos, herramientas computacionales y más de la iniciativa EASER."
          : "Explore research projects, datasets, computational tools and more from the EASER initiative."}
      </p>

      {/* Search */}
      <div className="mt-8">
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={L === "es" ? "Buscar proyectos…" : "Search projects…"}
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500" />
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className={selectCls}>
          <option value="all">{L === "es" ? "Todos los tipos" : "All types"}</option>
          {PROJECT_TYPES.map((pt) => <option key={pt.value} value={pt.value}>{pt.label[L]}</option>)}
        </select>
        <select value={institution} onChange={(e) => setInstitution(e.target.value)} className={selectCls}>
          <option value="all">{L === "es" ? "Todas las instituciones" : "All institutions"}</option>
          {institutions.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} className={selectCls}>
          <option value="newest">{L === "es" ? "Más recientes" : "Newest"}</option>
          <option value="oldest">{L === "es" ? "Más antiguos" : "Oldest"}</option>
          <option value="az">A–Z</option>
        </select>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-stone-300 bg-white p-1">
          <button onClick={() => setView("grid")} aria-label="Grid view"
            className={`grid h-8 w-8 place-items-center rounded ${view === "grid" ? "bg-brand-100 text-brand-800" : "text-stone-400 hover:text-stone-600"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z" /></svg>
          </button>
          <button onClick={() => setView("list")} aria-label="List view"
            className={`grid h-8 w-8 place-items-center rounded ${view === "list" ? "bg-brand-100 text-brand-800" : "text-stone-400 hover:text-stone-600"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18v3H3zM3 10.5h18v3H3zM3 16h18v3H3z" /></svg>
          </button>
        </div>
      </div>

      {loading ? <p className="mt-10 text-stone-500">{L === "es" ? "Cargando…" : "Loading…"}</p>
        : !filtered.length ? (
          <Card className="mt-8 p-10 text-center text-sm text-stone-600">
            {projects.length
              ? (L === "es" ? "Ningún proyecto coincide con tu búsqueda." : "No projects match your search.")
              : (L === "es" ? "Aún no hay proyectos publicados. Los proyectos aprobados por el equipo EASER aparecerán aquí." : "No projects have been published yet. Projects approved by the EASER team will appear here.")}
          </Card>
        ) : view === "grid" ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="group block">
                <Card className="flex h-full flex-col overflow-hidden transition group-hover:-translate-y-0.5 group-hover:shadow-card">
                  <CategoryVisual seed={p.id} rounded="rounded-none" className="h-40 w-full" />
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-700">{projectTypeLabel(p.projectType, L)}</p>
                    <h2 className="mt-1 font-serif font-semibold text-stone-900 group-hover:text-brand-800">{p.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600">{p.description}</p>
                    <div className="mt-2 text-xs text-stone-500">
                      {p.institutions[0] && <p className="truncate">{p.institutions[0]}</p>}
                      {p.authors[0] && <p className="truncate">{p.authors[0]}</p>}
                    </div>
                    {p.keywords?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{p.keywords.slice(0, 3).map((k) => <Badge key={k}>{k}</Badge>)}</div>}
                    <span className="mt-auto pt-3 text-sm font-medium text-brand-700 group-hover:underline">{L === "es" ? "Abrir proyecto" : "Open project"} →</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {shown.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="group block">
                <Card className="flex gap-5 overflow-hidden p-4 transition group-hover:shadow-card sm:items-center">
                  <CategoryVisual seed={p.id} className="hidden h-24 w-40 shrink-0 sm:block" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-700">{projectTypeLabel(p.projectType, L)}</p>
                    <h2 className="mt-0.5 font-serif font-semibold text-stone-900 group-hover:text-brand-800">{p.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600">{p.description}</p>
                    <p className="mt-1 text-xs text-stone-500">{[p.institutions[0], p.authors[0]].filter(Boolean).join(" · ")}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-600 disabled:opacity-40 hover:bg-stone-50">←</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <button key={n} onClick={() => setPage(n)}
              className={`h-9 w-9 rounded-lg text-sm font-medium ${n === page ? "bg-brand-700 text-white" : "border border-stone-300 text-stone-600 hover:bg-stone-50"}`}>{n}</button>
          ))}
          <button disabled={page === pages} onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-600 disabled:opacity-40 hover:bg-stone-50">→</button>
        </div>
      )}
    </div>
  );
}
