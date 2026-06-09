"use client";
import { useState } from "react";
import { Card, Input, Button, Badge } from "@/components/ui";
import { apiGet } from "@/lib/client";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [res, setRes] = useState<{ files: any[]; registry: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try { setRes(await apiGet(`/api/search?q=${encodeURIComponent(q)}`)); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">Search</h1>
      <p className="mt-2 text-stone-600">Search published contributions and repository files.</p>
      <form onSubmit={run} className="mt-6 flex gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. seismic, dataset, .py" />
        <Button type="submit" disabled={loading}>{loading ? "…" : "Search"}</Button>
      </form>

      {res && (
        <div className="mt-8 space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-stone-900">Published contributions ({res.registry.length})</h2>
            <div className="space-y-2">
              {res.registry.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <a href={r.githubUrl} target="_blank" rel="noreferrer" className="font-medium text-brand-700 hover:underline">{r.title}</a>
                    <Badge color="blue">{r.category}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-stone-600">{r.description}</p>
                  <p className="mt-1 text-xs text-stone-500">{r.author} · {r.affiliation}</p>
                </Card>
              ))}
              {!res.registry.length && <p className="text-sm text-stone-500">No published contributions match.</p>}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-lg font-semibold text-stone-900">Repository files ({res.files.length})</h2>
            <Card className="divide-y divide-stone-100">
              {res.files.map((file) => (
                <a key={file.path} href={`https://github.com/glxriap-7295/easer_repository/blob/main/${file.path}`} target="_blank" rel="noreferrer" className="block px-4 py-2.5 font-mono text-sm text-stone-700 hover:bg-stone-50">{file.path}</a>
              ))}
              {!res.files.length && <p className="px-4 py-3 text-sm text-stone-500">No files match (or GitHub not configured).</p>}
            </Card>
          </section>
        </div>
      )}
    </div>
  );
}
