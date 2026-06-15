"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";

interface ProjectCardData {
  id: string; title: string; description: string; authors: string[]; institutions: string[];
  keywords: string[]; version: number; fileCount: number; year: number;
}

export default function BrowsePage() {
  const { t } = useT();
  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { apiGet<ProjectCardData[]>("/api/public/projects").then(setProjects).catch(() => setProjects([])).finally(() => setLoading(false)); }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">{t("common.browse")}</h1>
      <p className="mt-2 text-stone-600">Published research projects in the EASER repository. Open a project to read its summary and access its resources.</p>

      {loading ? <p className="mt-8 text-stone-500">{t("common.loading")}</p>
        : !projects.length ? (
          <Card className="mt-8 p-8 text-center text-sm text-stone-600">
            No published projects yet. <Link href="/contribute" className="text-accent-700 underline">Contribute the first one</Link>.
          </Card>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="flex h-full flex-col p-5 transition hover:shadow-card">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-serif font-semibold text-brand-800">{p.title}</h2>
                    <Badge color="blue">v{p.version}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-3 text-sm text-stone-600">{p.description}</p>
                  <div className="mt-2 text-xs text-stone-500">
                    <p className="truncate font-medium">{p.authors.join(", ") || "—"}</p>
                    {p.institutions.length > 0 && <p className="truncate">{p.institutions.join(" · ")}</p>}
                  </div>
                  {p.keywords?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{p.keywords.slice(0, 4).map((k) => <Badge key={k}>{k}</Badge>)}</div>}
                  <div className="mt-auto pt-3 text-xs text-stone-400">{p.fileCount} file(s) · {p.year}</div>
                </Card>
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}
