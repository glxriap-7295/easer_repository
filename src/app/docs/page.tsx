"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { apiGet } from "@/lib/client";
import { useT } from "@/components/i18n/LanguageProvider";
import type { RegistryRecord } from "@/lib/types";

export default function DocsPage() {
  const { t } = useT();
  const [items, setItems] = useState<RegistryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiGet<RegistryRecord[]>("/api/registry").then(setItems).catch(() => setItems([])).finally(() => setLoading(false)); }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">{t("docs.title")}</h1>
      <p className="mt-2 text-stone-600">{t("docs.subtitle")}</p>
      {loading ? <p className="mt-8 text-stone-500">{t("common.loading")}</p>
        : !items.length ? <Card className="mt-8 p-6 text-sm text-stone-600">{t("docs.empty")}</Card>
        : (
          <div className="mt-8 space-y-3">
            {items.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between">
                  <a href={r.githubUrl} target="_blank" rel="noreferrer" className="font-serif font-medium text-brand-800 hover:underline">{r.title}</a>
                  <Badge color="blue">{r.category}</Badge>
                </div>
                <p className="mt-1 text-sm text-stone-600">{r.description}</p>
                <p className="mt-1 text-xs text-stone-500">{(r.authors?.length ? r.authors : [r.author]).join(", ")} · {(r.institutions?.length ? r.institutions : [r.affiliation]).filter(Boolean).join(", ")} · <code>{r.repoPath}</code></p>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}
