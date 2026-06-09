"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { apiGet } from "@/lib/client";
import type { RegistryRecord } from "@/lib/types";

export default function DocsPage() {
  const [items, setItems] = useState<RegistryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<RegistryRecord[]>("/api/registry")
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Documentation</h1>
      <p className="mt-2 text-slate-600">
        Auto-generated, curator-reviewed documentation for every published contribution. Each entry links
        to its README in the GitHub repository.
      </p>

      {loading ? (
        <p className="mt-8 text-slate-500">Loading…</p>
      ) : !items.length ? (
        <Card className="mt-8 p-6 text-sm text-slate-600">
          No published documentation yet. Once contributions are approved, their generated READMEs appear
          here and are committed to <code>easer_repository</code>.
        </Card>
      ) : (
        <div className="mt-8 space-y-3">
          {items.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between">
                <a href={r.githubUrl} target="_blank" rel="noreferrer" className="font-medium text-brand-700 hover:underline">{r.title}</a>
                <Badge color="blue">{r.category}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-600">{r.description}</p>
              <p className="mt-1 text-xs text-slate-500">{r.author} · {r.affiliation} · <code>{r.repoPath}</code></p>
              {r.keywords?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">{r.keywords.map((k) => <Badge key={k}>{k}</Badge>)}</div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
