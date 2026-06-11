import { listRegistry } from "@/lib/store";
import { ok } from "@/lib/api";
import type { RegistryRecord } from "@/lib/types";

export const runtime = "nodejs";

// Distinct values for building search filter dropdowns.
export async function GET() {
  const rows = await listRegistry();
  const authors = new Set<string>();
  const institutions = new Set<string>();
  const categories = new Set<string>();
  const keywords = new Set<string>();
  const years = new Set<number>();
  const add = (r: RegistryRecord) => {
    (r.authors?.length ? r.authors : [r.author]).filter(Boolean).forEach((a) => authors.add(a));
    (r.institutions?.length ? r.institutions : [r.affiliation]).filter(Boolean).forEach((i) => institutions.add(i));
    if (r.category) categories.add(r.category);
    (r.keywords || []).forEach((k) => k && keywords.add(k));
    years.add(r.year || new Date(r.approvedAt).getFullYear());
  };
  rows.forEach(add);
  return ok({
    authors: [...authors].sort(),
    institutions: [...institutions].sort(),
    categories: [...categories].sort(),
    keywords: [...keywords].sort(),
    years: [...years].sort((a, b) => b - a)
  });
}
