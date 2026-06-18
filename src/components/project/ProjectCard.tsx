"use client";
import { Card, Badge } from "@/components/ui";
import { CATEGORIES, orderInstitutions } from "@/lib/constants";
import type { RegistryRecord } from "@/lib/types";

// Reusable card for a published project (homepage, search, profiles).
export function ProjectCard({ r }: { r: RegistryRecord }) {
  const categoryLabel = CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category;
  const authors = r.authors?.length ? r.authors : [r.author].filter(Boolean);
  const institutions = orderInstitutions((r.institutions?.length ? r.institutions : [r.affiliation].filter(Boolean)) as string[]);
  return (
    <Card className="flex h-full flex-col p-5 transition hover:shadow-card">
      <div className="flex items-start justify-between gap-2">
        <a href={`/projects/${r.id}`} className="font-serif font-semibold text-brand-800 hover:underline">{r.title}</a>
        <Badge color="blue">{categoryLabel}</Badge>
      </div>
      <p className="mt-1 text-sm text-stone-600 line-clamp-3">{r.description}</p>
      <div className="mt-2 text-xs text-stone-500">
        <p className="truncate"><span className="font-medium">{authors.join(", ") || "—"}</span></p>
        {institutions.length > 0 && <p className="truncate">{institutions.join(" · ")}</p>}
      </div>
      {r.keywords?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {r.keywords.slice(0, 4).map((k) => <Badge key={k}>{k}</Badge>)}
        </div>
      )}
      <div className="mt-auto pt-3 text-xs text-stone-400">{r.year || new Date(r.approvedAt).getFullYear()}</div>
    </Card>
  );
}
