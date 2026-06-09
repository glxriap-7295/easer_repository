"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import { slugify } from "@/lib/constants";
import type { RegistryRecord } from "@/lib/types";

export default function ResearchersIndex() {
  const { t } = useT();
  const [people, setPeople] = useState<{ name: string; count: number; institutions: string[] }[]>([]);

  useEffect(() => {
    apiGet<RegistryRecord[]>("/api/registry").then((rows) => {
      const map = new Map<string, { name: string; count: number; institutions: Set<string> }>();
      rows.forEach((r) => {
        const authors = r.authors?.length ? r.authors : [r.author].filter(Boolean);
        const insts = r.institutions?.length ? r.institutions : [r.affiliation].filter(Boolean);
        authors.forEach((a) => {
          const k = a.toLowerCase();
          if (!map.has(k)) map.set(k, { name: a, count: 0, institutions: new Set() });
          const e = map.get(k)!; e.count++; insts.forEach((i) => i && e.institutions.add(i));
        });
      });
      setPeople([...map.values()].map((e) => ({ name: e.name, count: e.count, institutions: [...e.institutions] })).sort((a, b) => b.count - a.count));
    }).catch(() => setPeople([]));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">{t("researchers.title")}</h1>
      <p className="mt-2 text-stone-600">{t("researchers.subtitle")}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <Link key={p.name} href={`/researchers/${slugify(p.name)}`}>
            <Card className="flex h-full items-center gap-3 p-4 transition hover:shadow-card">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-700 text-sm font-semibold text-white">
                {p.name.split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("")}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">{p.name}</p>
                <p className="truncate text-xs text-stone-500">{p.institutions[0] || "—"}</p>
                <p className="text-xs text-accent-600">{p.count} {t("researchers.contributions")}</p>
              </div>
            </Card>
          </Link>
        ))}
        {!people.length && <p className="text-sm text-stone-500">{t("home.noProjects")}</p>}
      </div>
    </div>
  );
}
