"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
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
  repoPath?: string; repoUrl?: string; githubUrl?: string; publishedAt?: string;
}

function Section({ id, title, children, es, en, lang }: { id: string; title?: string; children: React.ReactNode; es?: string; en?: string; lang: string }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-xl font-bold text-stone-900">{title || (lang === "es" ? es : en)}</h2>
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

  useEffect(() => { apiGet<PublicProject>(`/api/public/projects/${id}`).then(setP).catch((e) => setErr(e.message)); }, [id]);

  if (err) return <div className="mx-auto max-w-3xl px-4 py-16"><Card className="border-amber-200 bg-amber-50 p-4 text-amber-800">{err} — <Link className="underline" href="/browse">{t("common.browse")}</Link></Card></div>;
  if (!p) return <div className="mx-auto max-w-3xl px-4 py-16 text-stone-500">{t("common.loading")}</div>;

  const featuredPdf = p.resources.find((r) => r.category === "report" && r.isPdf && r.downloadUrl);
  const tools = p.resources.filter((r) => r.category === "model");
  const groups = FILE_CATEGORIES.map((c) => ({ ...c, items: p.resources.filter((r) => r.category === c.value) })).filter((g) => g.items.length);
  const media = p.resources.filter((r) => /\.(png|jpe?g|gif|webp|svg|mp4|mov|webm)$/i.test(r.name) || r.category === "presentation");
  const summaryCounts: { label: string; n: number }[] = [
    { label: L === "es" ? "Modelos computacionales" : "Computational models", n: p.resources.filter((r) => r.category === "model" && !/\.ipynb$/i.test(r.name)).length },
    { label: L === "es" ? "Notebooks" : "Notebooks", n: p.resources.filter((r) => /\.ipynb$/i.test(r.name)).length },
    { label: L === "es" ? "Scripts" : "Scripts", n: p.resources.filter((r) => /\.(py|m|jl|r|sh|js|cpp|c|f90)$/i.test(r.name)).length },
    { label: L === "es" ? "Conjuntos de datos" : "Datasets", n: p.resources.filter((r) => r.category === "dataset").length },
    { label: L === "es" ? "Figuras" : "Figures", n: p.resources.filter((r) => /\.(png|jpe?g|gif|webp|svg|tif|tiff)$/i.test(r.name)).length },
    { label: L === "es" ? "Capas GIS" : "GIS layers", n: p.resources.filter((r) => r.category === "gis").length },
    { label: L === "es" ? "Publicaciones" : "Publications", n: p.publications.length }
  ].filter((c) => c.n > 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/browse" className="text-sm text-accent-700 hover:underline">← {t("common.browse")}</Link>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge color="blue">{projectTypeLabel(p.projectType, L)}</Badge>
            <Badge>v{p.version}</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-stone-900">{p.title}</h1>
        </div>
        {p.repoUrl && <a href={p.repoUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100">{L === "es" ? "Ver en GitHub" : "View on GitHub"} ↗</a>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-stone-600">
        <span><span className="font-medium text-stone-500">{L === "es" ? "Autores" : "Authors"}:</span> {p.authors.map((a) => a.name).join(", ") || "—"}</span>
        {p.publishedAt && <span><span className="font-medium text-stone-500">{L === "es" ? "Publicado" : "Published"}:</span> {new Date(p.publishedAt).toLocaleDateString()}</span>}
      </div>
      {p.institutions.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">{p.institutions.map((i) => <InstitutionLogo key={i.name} name={i.name} className="h-6" showName />)}</div>}
      {p.keywords?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{p.keywords.map((k) => <Badge key={k}>{k}</Badge>)}</div>}

      <div className="mt-8 space-y-10">
        {/* 1 · Scientific Overview */}
        <Section id="overview" lang={L} es="Resumen científico" en="Scientific Overview">
          {featuredPdf && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-stone-500">{L === "es" ? "Documento destacado" : "Featured paper"}</p>
              <PDFViewer url={featuredPdf.downloadUrl!} fileName={featuredPdf.name} title={p.title} />
            </div>
          )}
          <Card className="p-6"><Markdown>{p.summary}</Markdown></Card>
        </Section>

        {/* Repository Summary */}
        {summaryCounts.length > 0 && (
          <Section id="repo-summary" lang={L} es="Resumen del repositorio" en="Repository Summary">
            <Card className="p-5">
              <p className="text-sm text-stone-600">{L === "es" ? "El repositorio incluye:" : "The repository includes:"}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {summaryCounts.map((c) => (
                  <div key={c.label} className="rounded-lg border border-stone-100 bg-stone-50 p-3 text-center">
                    <p className="font-serif text-2xl font-bold text-brand-700">{c.n}</p>
                    <p className="text-xs text-stone-600">{c.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </Section>
        )}

        {/* 2 · Project Description */}
        <Section id="description" lang={L} es="Descripción del proyecto" en="Project Description">
          <Card className="p-6 text-sm">
            <p className="text-stone-700">{p.description || "—"}</p>
            {p.purpose && <p className="mt-3 text-stone-700"><span className="font-medium text-stone-500">{L === "es" ? "Propósito" : "Purpose"}:</span> {p.purpose}</p>}
            <p className="mt-3 text-stone-700"><span className="font-medium text-stone-500">{L === "es" ? "Herramientas computacionales" : "Computational tools"}:</span> {tools.length ? tools.map((tt) => tt.name).join(", ") : (L === "es" ? "Ver recursos" : "See resources")}</p>
          </Card>
        </Section>

        {/* 3 · Resources */}
        {(p.extraResources.length > 0 || p.repoUrl) && (
          <Section id="resources" lang={L} es="Recursos" en="Resources">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {p.repoUrl && (
                <a href={p.repoUrl} target="_blank" rel="noreferrer"><Card className="h-full p-4 transition hover:shadow-card"><Badge color="blue">GitHub</Badge><p className="mt-1 font-medium text-stone-900">{L === "es" ? "Repositorio" : "Repository"}</p><p className="text-xs text-stone-500">{L === "es" ? "Contenido completo del proyecto" : "Full project contents"}</p></Card></a>
              )}
              {p.extraResources.map((r, i) => (
                <a key={i} href={r.url || "#"} target={r.url ? "_blank" : undefined} rel="noreferrer"><Card className="h-full p-4 transition hover:shadow-card"><Badge>{r.kind}</Badge><p className="mt-1 font-medium text-stone-900">{r.label}</p>{r.description && <p className="text-xs text-stone-500">{r.description}</p>}</Card></a>
              ))}
            </div>
          </Section>
        )}

        {/* 4 · Repository (README) */}
        {p.readme && (
          <Section id="repository" lang={L} es="Repositorio" en="Repository">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone-600">{L === "es" ? "Documentación técnica generada del repositorio." : "Technical documentation generated from the repository."}</p>
                <button onClick={() => setShowReadme(!showReadme)} className="text-sm text-accent-700 hover:underline">{showReadme ? (L === "es" ? "Ocultar README" : "Hide README") : (L === "es" ? "Ver README" : "View README")}</button>
              </div>
              {showReadme && <div className="mt-4 border-t border-stone-100 pt-4"><Markdown>{p.readme}</Markdown></div>}
            </Card>
          </Section>
        )}

        {/* 5 · Downloads */}
        {groups.length > 0 && (
          <Section id="downloads" lang={L} es="Descargas" en="Downloads">
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

        {/* 6 · Publications */}
        {p.publications.length > 0 && (
          <Section id="publications" lang={L} es="Publicaciones" en="Publications">
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

        {/* 7 · Media */}
        {media.length > 0 && (
          <Section id="media" lang={L} es="Multimedia" en="Media">
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

        {/* 8 · Related Projects */}
        <Section id="related" lang={L} es="Proyectos relacionados" en="Related Projects">
          <Card className="p-6 text-sm text-stone-600">
            {L === "es" ? "Explora más proyectos de investigación de EASER." : "Explore more EASER research projects."}
            {" "}<Link href="/browse" className="text-accent-700 hover:underline">{L === "es" ? "Ver todos" : "Browse all"} →</Link>
          </Card>
        </Section>

        {p.history?.length > 1 && (
          <p className="text-xs text-stone-400">{L === "es" ? "Historial" : "History"}: {p.history.map((h) => `v${h.version}`).join(" · ")}</p>
        )}
      </div>
    </div>
  );
}
