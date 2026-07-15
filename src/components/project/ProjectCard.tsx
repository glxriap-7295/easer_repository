"use client";
import Link from "next/link";
import { Card, Badge } from "@/components/ui";
import { CategoryVisual } from "@/components/ui/visuals";
import { CATEGORIES, orderInstitutions } from "@/lib/constants";
import type { RegistryRecord } from "@/lib/types";

// Publication-style project card (search, profiles, our-work). Reads like a
// research entry — hero image, category, title, summary, institution, PI.
export function ProjectCard({ r }: { r: RegistryRecord }) {
  const categoryLabel = CATEGORIES.find((c) => c.value === r.category)?.label ?? r.category;
  const authors = r.authors?.length ? r.authors : [r.author].filter(Boolean);
  const institutions = orderInstitutions((r.institutions?.length ? r.institutions : [r.affiliation].filter(Boolean)) as string[]);
  return (
    <Link href={`/projects/${r.id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition group-hover:-translate-y-0.5 group-hover:shadow-card">
        <CategoryVisual seed={r.id} rounded="rounded-none" className="h-40 w-full" />
        <div className="flex flex-1 flex-col p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-700">{categoryLabel}</p>
          <h3 className="mt-1 font-serif font-semibold text-stone-900 group-hover:text-brand-800">{r.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-stone-600">{r.description}</p>
          <div className="mt-2 text-xs text-stone-500">
            {institutions[0] && <p className="truncate">{institutions[0]}</p>}
            {authors[0] && <p className="truncate">{authors[0]}</p>}
          </div>
          {r.keywords?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">{r.keywords.slice(0, 3).map((k) => <Badge key={k}>{k}</Badge>)}</div>
          )}
          <span className="mt-auto pt-3 text-sm font-medium text-brand-700 group-hover:underline">Open project →</span>
        </div>
      </Card>
    </Link>
  );
}
