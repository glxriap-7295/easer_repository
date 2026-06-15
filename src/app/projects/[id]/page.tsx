"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import { FILE_CATEGORIES } from "@/lib/constants";

interface Resource { name: string; category: string; categoryLabel: string; folder: string; metadata: Record<string, string>; url?: string; }
interface PublicProject {
  id: string; title: string; description: string; purpose: string;
  authors: { name: string; orcid?: string }[]; institutions: { name: string; department?: string }[];
  contactName: string; contactEmail: string; keywords: string[]; license?: string;
  version: number; readme: string; summary: string; resources: Resource[];
  history: { version: number; at: string; note: string }[];
  timeline: { at: string; action: string }[];
  repoPath?: string; githubUrl?: string; publishedAt?: string;
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useT();
  const [p, setP] = useState<PublicProject | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"summary" | "readme">("summary");

  useEffect(() => { apiGet<PublicProject>(`/api/public/projects/${id}`).then(setP).catch((e) => setErr(e.message)); }, [id]);

  if (err) return <div className="mx-auto max-w-3xl px-4 py-16"><Card className="border-amber-200 bg-amber-50 p-4 text-amber-800">{err} — <Link className="underline" href="/browse">{t("common.browse")}</Link></Card></div>;
  if (!p) return <div className="mx-auto max-w-3xl px-4 py-16 text-stone-500">{t("common.loading")}</div>;

  const groups = FILE_CATEGORIES.map((c) => ({ ...c, items: p.resources.filter((r) => r.category === c.value) })).filter((g) => g.items.length);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/browse" className="text-sm text-accent-700 hover:underline">← {t("common.browse")}</Link>

      {/* Header */}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">{p.title}</h1>
          <p className="mt-2 text-stone-600">{p.description}</p>
        </div>
        <Badge color="blue">v{p.version}</Badge>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-stone-600">
        <span><span className="font-medium text-stone-500">Authors:</span> {p.authors.map((a) => a.name).join(", ") || "—"}</span>
        <span><span className="font-medium text-stone-500">Institutions:</span> {p.institutions.map((i) => i.name).join(", ") || "—"}</span>
        {p.publishedAt && <span><span className="font-medium text-stone-500">Published:</span> {new Date(p.publishedAt).toLocaleDateString()}</span>}
      </div>
      {p.keywords?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{p.keywords.map((k) => <Badge key={k}>{k}</Badge>)}</div>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main */}
        <div>
          {/* Summary / README tabs */}
          <Card className="p-0">
            <div className="flex border-b border-stone-200">
              <button onClick={() => setTab("summary")} className={`px-4 py-2.5 text-sm font-medium ${tab === "summary" ? "border-b-2 border-brand-700 text-brand-800" : "text-stone-500 hover:text-stone-800"}`}>AI Summary</button>
              <button onClick={() => setTab("readme")} className={`px-4 py-2.5 text-sm font-medium ${tab === "readme" ? "border-b-2 border-brand-700 text-brand-800" : "text-stone-500 hover:text-stone-800"}`}>README</button>
            </div>
            <div className="p-5"><Markdown>{tab === "summary" ? p.summary : p.readme}</Markdown></div>
          </Card>

          {/* Categorized resources */}
          <h2 className="mt-8 text-xl font-bold text-stone-900">Project resources</h2>
          <p className="mt-1 text-sm text-stone-500">Files grouped by type. {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noreferrer" className="text-accent-700 hover:underline">Open in repository →</a>}</p>
          <div className="mt-4 space-y-4">
            {groups.map((g) => (
              <Card key={g.value} className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-semibold text-brand-800">{g.folder}</h3>
                  <Badge>{g.items.length}</Badge>
                </div>
                <p className="text-xs text-stone-500">{g.description}</p>
                <ul className="mt-3 space-y-2">
                  {g.items.map((r, i) => (
                    <li key={i} className="rounded-lg border border-stone-100 px-3 py-2 text-sm">
                      <span className="font-mono text-stone-800">{r.name}</span>
                      {Object.entries(r.metadata).filter(([, v]) => v).length > 0 && (
                        <span className="mt-1 block text-xs text-stone-500">
                          {Object.entries(r.metadata).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
            {!groups.length && <p className="text-sm text-stone-500">No resources yet.</p>}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Where to start</h3>
            <p className="mt-2 text-sm text-stone-700">Read the <strong>AI Summary</strong>, then open the resource folder most relevant to your work.</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Project metadata</h3>
            <dl className="mt-2 space-y-1 text-sm text-stone-700">
              {p.license && <div><dt className="text-stone-500">License</dt><dd>{p.license}</dd></div>}
              <div><dt className="text-stone-500">Contact</dt><dd>{p.contactName} {p.contactEmail && <a className="text-accent-700 hover:underline" href={`mailto:${p.contactEmail}`}>✉</a>}</dd></div>
              {p.repoPath && <div><dt className="text-stone-500">Repository path</dt><dd className="break-all font-mono text-xs">{p.repoPath}</dd></div>}
            </dl>
          </Card>
          {p.history?.length > 0 && (
            <Card className="p-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">History</h3>
              <ul className="mt-2 space-y-1 text-sm text-stone-700">
                {[...p.history].reverse().map((h) => (
                  <li key={h.version}><span className="font-medium">v{h.version}</span> — {h.note} <span className="text-xs text-stone-400">({new Date(h.at).toLocaleDateString()})</span></li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
