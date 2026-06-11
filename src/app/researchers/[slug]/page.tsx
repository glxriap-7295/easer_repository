"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProjectCard } from "@/components/project/ProjectCard";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import { slugify } from "@/lib/constants";
import type { RegistryRecord } from "@/lib/types";

export default function ResearcherProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useT();
  const [items, setItems] = useState<RegistryRecord[]>([]);
  const [name, setName] = useState("");
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<RegistryRecord[]>("/api/registry").then((rows) => {
      const mine = rows.filter((r) => {
        const authors = r.authors?.length ? r.authors : [r.author].filter(Boolean);
        return authors.some((a) => slugify(a) === slug);
      });
      setItems(mine);
      const authors = mine.flatMap((r) => (r.authors?.length ? r.authors : [r.author]));
      setName(authors.find((a) => slugify(a) === slug) || slug);
      const insts = new Set<string>();
      mine.forEach((r) => (r.institutions?.length ? r.institutions : [r.affiliation]).forEach((i) => i && insts.add(i)));
      setInstitutions([...insts]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-stone-500">{t("common.loading")}</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link href="/researchers" className="text-sm text-accent-600 hover:underline">← {t("researchers.title")}</Link>
      <div className="mt-3 flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-700 text-lg font-semibold text-white">
          {name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("")}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{name}</h1>
          <p className="text-sm text-stone-500">{institutions.join(" · ") || "—"}</p>
          <p className="text-xs text-accent-600">{items.length} {t("researchers.contributions")}</p>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-stone-900">{t("researchers.profileOf")} {name}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((r) => <ProjectCard key={r.id} r={r} />)}
      </div>
      {!items.length && <p className="mt-4 text-sm text-stone-500">{t("home.noProjects")}</p>}
    </div>
  );
}
