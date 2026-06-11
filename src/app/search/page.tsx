"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, Input, Button, Select } from "@/components/ui";
import { ProjectCard } from "@/components/project/ProjectCard";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import type { RegistryRecord } from "@/lib/types";

interface Facets { authors: string[]; institutions: string[]; categories: string[]; keywords: string[]; years: number[]; }

export default function SearchPage() {
  const { t } = useT();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [year, setYear] = useState("");
  const [institution, setInstitution] = useState("");
  const [author, setAuthor] = useState("");
  const [keyword, setKeyword] = useState("");
  const [facets, setFacets] = useState<Facets | null>(null);
  const [results, setResults] = useState<RegistryRecord[]>([]);
  const [files, setFiles] = useState<{ path: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { apiGet<Facets>("/api/registry/facets").then(setFacets).catch(() => {}); }, []);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (year) p.set("year", year);
    if (institution) p.set("institution", institution);
    if (author) p.set("author", author);
    if (keyword) p.set("keyword", keyword);
    return p.toString();
  }, [q, category, year, institution, author, keyword]);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    try {
      const [reg, fileRes] = await Promise.all([
        apiGet<RegistryRecord[]>(`/api/registry?${query}`),
        q ? apiGet<{ files: { path: string }[] }>(`/api/search?q=${encodeURIComponent(q)}`).catch(() => ({ files: [] })) : Promise.resolve({ files: [] })
      ]);
      setResults(reg); setFiles((fileRes as any).files || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { run(); /* initial load */ /* eslint-disable-next-line */ }, []);

  function clear() { setQ(""); setCategory(""); setYear(""); setInstitution(""); setAuthor(""); setKeyword(""); }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">{t("search.title")}</h1>
      <p className="mt-2 text-stone-600">{t("search.subtitle")}</p>

      <form onSubmit={run} className="mt-6 flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search.placeholder")} />
        <Button type="submit" disabled={loading}>{loading ? "…" : t("search.apply")}</Button>
      </form>

      <div className="mt-8 grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{t("search.filters")}</h2>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t("search.allCategories")}</option>
            {facets?.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">{t("search.allYears")}</option>
            {facets?.years.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
          <Select value={institution} onChange={(e) => setInstitution(e.target.value)}>
            <option value="">{t("search.allInstitutions")}</option>
            {facets?.institutions.map((i) => <option key={i} value={i}>{i}</option>)}
          </Select>
          <Select value={author} onChange={(e) => setAuthor(e.target.value)}>
            <option value="">{t("search.allAuthors")}</option>
            {facets?.authors.map((a) => <option key={a} value={a}>{a}</option>)}
          </Select>
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={t("contribute.keywords")} />
          <div className="flex gap-2">
            <Button type="button" onClick={() => run()} className="flex-1">{t("search.apply")}</Button>
            <Button type="button" variant="ghost" onClick={() => { clear(); setTimeout(run, 0); }}>{t("search.clear")}</Button>
          </div>
        </aside>

        <div>
          <h2 className="mb-3 text-lg font-semibold text-stone-900">{t("search.projects")} ({results.length})</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((r) => <ProjectCard key={r.id} r={r} />)}
          </div>
          {!results.length && <p className="text-sm text-stone-500">{t("search.noResults")}</p>}

          {files.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-semibold text-stone-900">{t("search.repoFiles")} ({files.length})</h2>
              <Card className="divide-y divide-stone-100">
                {files.map((f) => (
                  <a key={f.path} href={`https://github.com/glxriap-7295/easer_repository/blob/main/${f.path}`} target="_blank" rel="noreferrer" className="block px-4 py-2.5 font-mono text-sm text-stone-700 hover:bg-stone-50">{f.path}</a>
                ))}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
