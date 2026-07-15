"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { CategoryVisual } from "@/components/ui/visuals";
import { Markdown } from "@/components/Markdown";
import { PDFViewer } from "@/components/PDFViewer";
import { InstitutionLogo } from "@/components/InstitutionLogo";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import { FILE_CATEGORIES, projectTypeLabel } from "@/lib/constants";
import type { Publication, ProjectResource } from "@/lib/types";

interface Resource { name: string; category: string; categoryLabel: string; folder: string; metadata: Record<string, string>; size?: number; isPdf?: boolean; downloadUrl?: string; githubUrl?: string; }
interface PublicProject {
  id: string; title: string; description: string; purpose: string; projectType?: string;
  authors: { name: string; orcid?: string }[]; institutions: { name: string; department?: string }[];
  contactName: string; contactEmail: string; keywords: string[]; license?: string;
  version: number; readme: string; summary: string; resources: Resource[];
  publications: Publication[]; extraResources: ProjectResource[];
  history: { version: number; at: string; note: string }[];
  repoPath?: string; repoUrl?: string; githubUrl?: string; publishedAt?: string; createdAt?: string;
}

// Small inline icons for the Repository Contents row.
const Icon = ({ d }: { d: string }) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d.split("|").map((p, i) => <path key={i} d={p} />)}</svg>;
const ICONS: Record<string, string> = {
  models: "M4 7l8-4 8 4-8 4-8-4z|M4 7v6l8 4 8-4V7",
  notebooks: "M4 4h13a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4z|M4 4v0M9 4v16",
  scripts: "M8 6l-4 6 4 6|M16 6l4 6-4 6|M13 4l-2 16",
  datasets: "M12 5c4 0 7 1 7 3s-3 3-7 3-7-1-7-3 3-3 7-3z|M5 8v8c0 2 3 3 7 3s7-1 7-3V8",
  figures: "M4 5h16v14H4z|M8 11a1.5 1.5 0 100-3 1.5 1.5 0 000 3z|M4 16l4-4 4 4 4-5 4 5",
  gis: "M9 4l6 2 6-2v14l-6 2-6-2-6 2V6l6-2z|M9 4v14M15 6v14",
  publications: "M6 3h9l3 3v15H6z|M9 8h6M9 12h6M9 16h4"
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-serif text-xl font-bold text-brand-800">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { t, lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const [p, setP] = useState<PublicProject | null>(null);
  const [err, setErr] = useState("");
  const [showReadme, setShowReadme] = useState(false);
  const [showFullOverview, setShowFullOverview] = useState(false);

  useEffect(() => { apiGet<PublicProject>(`/api/public/projects/${id}`).then(setP).catch((e) => setErr(e.message)); }, [id]);

  if (err) return <div className="mx-auto max-w-3xl px-4 py-16"><Card className="border-amber-200 bg-amber-50 p-4 text-amber-800">{err} — <Link className="underline" href="/browse">{t("common.browse")}</Link></Card></div>;
  if (!p) return <div className="mx-auto max-w-3xl px-4 py-16 text-stone-500">{t("common.loading")}</div>;

  const featuredPdf = p.resources.find((r) => r.category === "report" && r.isPdf && r.downloadUrl);
  const groups = FILE_CATEGORIES.map((c) => ({ ...c, items: p.resources.filter((r) => r.category === c.value) })).filter((g) => g.items.length);
  const media = p.resources.filter((r) => /\.(png|jpe?g|gif|webp|svg|mp4|mov|webm)$/i.test(r.name) || r.category === "presentation");
  const contents: { key: string; label: string; n: number }[] = [
    { key: "models", label: L === "es" ? "Modelos" : "Models", n: p.resources.filter((r) => r.category === "model" && !/\.ipynb$/i.test(r.name)).length },
    { key: "datasets", label: L === "es" ? "Datos" : "Datasets", n: p.resources.filter((r) => r.category === "dataset").length },
    { key: "scripts", label: "Scripts", n: p.resources.filter((r) => /\.(py|m|jl|r|sh|js|cpp|c|f90)$/i.test(r.name)).length },
    { key: "figures", label: L === "es" ? "Figuras" : "Figures", n: p.resources.filter((r) => /\.(png|jpe?g|gif|webp|svg|tif|tiff)$/i.test(r.name)).length },
    { key: "notebooks", label: "Notebooks", n: p.resources.filter((r) => /\.ipynb$/i.test(r.name)).length },
    { key: "gis", label: L === "es" ? "GIS" : "GIS", n: p.resources.filter((r) => r.category === "gis").length },
    { key: "publications", label: L === "es" ? "Publicaciones" : "Publications", n: p.publications.length }
  ].filter((c) => c.n > 0);

  const period = p.publishedAt ? new Date(p.publishedAt).getFullYear().toString() : (p.createdAt ? new Date(p.createdAt).getFullYear().toString() : "—");
  const tabs: { id: string; label: string }[] = [
    { id: "overview", label: L === "es" ? "Resumen" : "Overview" },
    { id: "description", label: L === "es" ? "Descripción" : "Description" },
    ...(p.extraResources.length || p.repoUrl ? [{ id: "resources", label: L === "es" ? "Recursos" : "Resources" }] : []),
    ...(p.readme ? [{ id: "repository", label: L === "es" ? "Repositorio" : "Repository" }] : []),
    ...(groups.length ? [{ id: "downloads", label: L === "es" ? "Descargas" : "Downloads" }] : []),
    ...(p.publications.length ? [{ id: "publications", label: L === "es" ? "Publicaciones" : "Publications" }] : []),
    ...(media.length ? [{ id: "media", label: L === "es" ? "Multimedia" : "Media" }] : []),
    { id: "related", label: L === "es" ? "Relacionados" : "Related Projects" }
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-stone-500">
        <Link href="/browse" className="hover:text-brand-700 hover:underline">{L === "es" ? "Proyectos" : "Projects"}</Link>
        <span className="mx-2 text-stone-300">/</span>
        <span className="text-stone-700">{p.title}</span>
      </nav>

      {/* Hero */}
      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <CategoryVisual seed={p.id} className="h-56 w-full md:h-full" />
        <div>
          <Badge color="blue">{projectTypeLabel(p.projectType, L)}</Badge>
          <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-stone-900">{p.title}</h1>
          <p className="mt-3 text-stone-600">{p.description}</p>
          {p.keywords?.length > 0 && <div className="mt-4 flex flex-wrap gap-1">{p.keywords.slice(0, 6).map((k) => <Badge key={k}>{k}</Badge>)}</div>}
        </div>
      </div>

      {/* Metadata strip */}
      <div className="mt-8 grid gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{L === "es" ? "Investigador principal" : "Principal Investigator"}</p>
          <p className="mt-1 text-sm font-medium text-stone-800">{p.authors[0]?.name || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{L === "es" ? "Institución" : "Institution"}</p>
          <p className="mt-1 text-sm font-medium text-stone-800">{p.institutions[0]?.name || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{L === "es" ? "Publicado" : "Published"}</p>
          <p className="mt-1 text-sm font-medium text-stone-800">{period}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">{L === "es" ? "Repositorio" : "Repository"}</p>
          {p.repoUrl
            ? <a href={p.repoUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-medium text-accent-700 hover:underline">{L === "es" ? "Ver repositorio" : "Visit repository"} ↗</a>
            : <p className="mt-1 text-sm text-stone-500">—</p>}
        </div>
      </div>

      {/* Tab nav */}
      <div className="sticky top-14 z-10 mt-8 -mx-4 overflow-x-auto border-b border-stone-200 bg-stone-50/95 px-4 backdrop-blur">
        <nav className="flex gap-5 text-sm">
          {tabs.map((tb) => (
            <a key={tb.id} href={`#${tb.id}`} className="whitespace-nowrap border-b-2 border-transparent py-3 font-medium text-stone-500 transition hover:border-brand-400 hover:text-brand-800">{tb.label}</a>
          ))}
        </nav>
      </div>

      <div className="mt-8 space-y-12">
        {/* Scientific Overview */}
        <Section id="overview" title={L === "es" ? "Resumen científico" : "Scientific Overview"}>
          {featuredPdf && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-stone-500">{L === "es" ? "Documento destacado" : "Featured paper"}</p>
              <PDFViewer url={featuredPdf.downloadUrl!} fileName={featuredPdf.name} title={p.title} />
            </div>
          )}
          <Card className="p-6">
            <div className={showFullOverview ? "" : "line-clamp-6"}><Markdown>{p.summary}</Markdown></div>
            <button onClick={() => setShowFullOverview((s) => !s)} className="mt-3 text-sm font-medium text-accent-700 hover:underline">
              {showFullOverview ? (L === "es" ? "Ver menos" : "Show less") : (L === "es" ? "Ver resumen completo" : "View full overview")} →
            </button>
            <p className="mt-4 border-t border-stone-100 pt-3 text-xs text-stone-400">
              {L === "es"
                ? "Generado automáticamente a partir del contenido del repositorio y revisado por los autores del proyecto cuando corresponde."
                : "Automatically generated from repository contents and reviewed by project authors when applicable."}
            </p>
          </Card>
        </Section>

        {/* Repository Contents (summary before the tree) */}
        {contents.length > 0 && (
          <Section id="repo-contents" title={L === "es" ? "Contenido del repositorio" : "Repository Contents"}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {contents.map((c) => (
                <div key={c.key} className="flex flex-col items-center rounded-xl border border-stone-200 bg-white p-4 text-center text-brand-700">
                  <Icon d={ICONS[c.key] || ICONS.datasets} />
                  <p className="mt-2 font-serif text-2xl font-bold text-stone-900">{c.n}</p>
                  <p className="text-xs text-stone-500">{c.label}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Description */}
        <Section id="description" title={L === "es" ? "Descripción" : "Description"}>
          <Card className="p-6 text-sm">
            <p className="text-stone-700">{p.description || "—"}</p>
            {p.purpose && <p className="mt-3 text-stone-700"><span className="font-medium text-stone-500">{L === "es" ? "Propósito" : "Purpose"}:</span> {p.purpose}</p>}
            {p.institutions.length > 0 && <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">{p.institutions.map((i) => <InstitutionLogo key={i.name} name={i.name} className="h-6" showName />)}</div>}
          </Card>
        </Section>

        {/* Resources */}
        {(p.extraResources.length > 0 || p.repoUrl) && (
          <Section id="resources" title={L === "es" ? "Recursos" : "Resources"}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {p.repoUrl && (
                <a href={p.repoUrl} target="_blank" rel="noreferrer"><Card className="h-full p-4 transition hover:shadow-card"><Badge color="blue">{L === "es" ? "Repositorio" : "Repository"}</Badge><p className="mt-1 font-medium text-stone-900">{L === "es" ? "Contenido del proyecto" : "Project repository"}</p><p className="text-xs text-stone-500">{L === "es" ? "Contenido completo del proyecto" : "Full project contents"}</p></Card></a>
              )}
              {p.extraResources.map((r, i) => (
                <a key={i} href={r.url || "#"} target={r.url ? "_blank" : undefined} rel="noreferrer"><Card className="h-full p-4 transition hover:shadow-card"><Badge>{r.provider || r.kind}</Badge><p className="mt-1 font-medium text-stone-900">{r.label}</p>{r.description && <p className="text-xs text-stone-500">{r.description}</p>}</Card></a>
              ))}
            </div>
            <p className="mt-3 text-xs text-stone-400">{L === "es" ? "Los recursos externos se alojan fuera de GitHub; el repositorio conserva sus metadatos." : "External resources are hosted outside GitHub; the repository keeps their metadata."}</p>
          </Section>
        )}

        {/* Repository (tree / README) — after the summary */}
        {p.readme && (
          <Section id="repository" title={L === "es" ? "Repositorio" : "Repository"}>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone-600">{L === "es" ? "Documentación técnica generada del repositorio." : "Technical documentation generated from the repository."}</p>
                <button onClick={() => setShowReadme(!showReadme)} className="text-sm font-medium text-accent-700 hover:underline">{showReadme ? (L === "es" ? "Ocultar README" : "Hide README") : (L === "es" ? "Ver README" : "View README")}</button>
              </div>
              {showReadme && <div className="mt-4 border-t border-stone-100 pt-4"><Markdown>{p.readme}</Markdown></div>}
            </Card>
          </Section>
        )}

        {/* Downloads */}
        {groups.length > 0 && (
          <Section id="downloads" title={L === "es" ? "Descargas" : "Downloads"}>
            <div className="space-y-4">
              {groups.map((g) => (
                <Card key={g.value} className="p-4">
                  <div className="flex items-center justify-between"><h3 className="font-serif font-semibold text-brand-800">{g.folder}</h3><Badge>{g.items.length}</Badge></div>
                  <ul className="mt-3 space-y-2">
                    {g.items.map((r, i) => (
                      <li key={i} className="rounded-lg border border-stone-100 px-3 py-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-mono text-stone-800">{r.name}</span>
                          {r.downloadUrl && <a href={r.downloadUrl} download={r.name} className="shrink-0 text-xs font-medium text-accent-700 hover:underline">{L === "es" ? "Descargar" : "Download"}</a>}
                        </div>
                        {Object.entries(r.metadata).filter(([, v]) => v).length > 0 && (
                          <span className="mt-1 block text-xs text-stone-500">{Object.entries(r.metadata).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" · ")}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* Publications */}
        {p.publications.length > 0 && (
          <Section id="publications" title={L === "es" ? "Publicaciones" : "Publications"}>
            <div className="space-y-3">
              {p.publications.map((pub, i) => {
                const link = pub.url || (pub.doi ? `https://doi.org/${pub.doi}` : "");
                return (
                  <Card key={i} className="p-4 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-stone-900">{link ? <a href={link} target="_blank" rel="noreferrer" className="text-brand-800 hover:underline">{pub.title}</a> : pub.title}</p>
                      {pub.access && <Badge color={pub.access === "open" ? "green" : "amber"}>{pub.access === "open" ? "Open Access" : (L === "es" ? "Restringido" : "Restricted")}</Badge>}
                    </div>
                    {pub.authors && <p className="text-stone-600">{pub.authors}</p>}
                    <p className="text-xs text-stone-500">{[pub.journal, pub.publisher].filter(Boolean).join(" · ")}{pub.doi ? ` · DOI: ${pub.doi}` : ""}</p>
                    {pub.abstract && <p className="mt-2 text-stone-600">{pub.abstract}</p>}
                    {link && <a href={link} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-accent-700 hover:underline">{L === "es" ? "Publicación oficial" : "Official publication"} ↗</a>}
                  </Card>
                );
              })}
            </div>
          </Section>
        )}

        {/* Media */}
        {media.length > 0 && (
          <Section id="media" title={L === "es" ? "Multimedia" : "Media"}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {media.map((m, i) => (
                <Card key={i} className="p-3 text-sm">
                  {/\.(png|jpe?g|gif|webp|svg)$/i.test(m.name) && m.downloadUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={m.downloadUrl} alt={m.name} className="mb-2 h-32 w-full rounded object-cover" />
                    : <div className="mb-2 grid h-32 place-items-center rounded bg-stone-100 text-2xl">🎬</div>}
                  <p className="truncate font-mono text-xs text-stone-700">{m.name}</p>
                  {m.downloadUrl && <a href={m.downloadUrl} target="_blank" rel="noreferrer" className="text-xs text-accent-700 hover:underline">{L === "es" ? "Abrir" : "Open"} ↗</a>}
                </Card>
              ))}
            </div>
          </Section>
        )}

        {/* Related Projects */}
        <Section id="related" title={L === "es" ? "Proyectos relacionados" : "Related Projects"}>
          <Card className="p-6 text-sm text-stone-600">
            {L === "es" ? "Explora más proyectos de investigación de EASER." : "Explore more EASER research projects."}
            {" "}<Link href="/browse" className="font-medium text-accent-700 hover:underline">{L === "es" ? "Ver todos" : "Browse all"} →</Link>
          </Card>
        </Section>

        {p.history?.length > 1 && (
          <p className="text-xs text-stone-400">{L === "es" ? "Historial" : "History"}: {p.history.map((h) => `v${h.version}`).join(" · ")}</p>
        )}
      </div>
    </div>
  );
}
