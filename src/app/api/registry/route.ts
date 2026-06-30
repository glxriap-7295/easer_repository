import { NextRequest } from "next/server";
import { listRegistry } from "@/lib/store";
import { ok } from "@/lib/api";
import type { RegistryRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always read fresh data (no build-time caching)

// Public list of published projects/contributions. Backward compatible: with no
// query params it returns the full array. Optional filters: q, category, year,
// author, institution, keyword.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim().toLowerCase();
  const category = sp.get("category") || "";
  const year = sp.get("year") || "";
  const author = (sp.get("author") || "").toLowerCase();
  const institution = (sp.get("institution") || "").toLowerCase();
  const keyword = (sp.get("keyword") || "").toLowerCase();

  let rows = await listRegistry();
  rows.sort((a, b) => b.approvedAt.localeCompare(a.approvedAt));

  const names = (r: RegistryRecord) => (r.authors?.length ? r.authors : [r.author]);
  const insts = (r: RegistryRecord) => (r.institutions?.length ? r.institutions : [r.affiliation]);

  if (q) rows = rows.filter((r) =>
    [r.title, r.description, ...(names(r)), ...(insts(r)), ...(r.keywords || [])].join(" ").toLowerCase().includes(q));
  if (category) rows = rows.filter((r) => r.category === category);
  if (year) rows = rows.filter((r) => String(r.year || new Date(r.approvedAt).getFullYear()) === year);
  if (author) rows = rows.filter((r) => names(r).some((n) => n.toLowerCase() === author));
  if (institution) rows = rows.filter((r) => insts(r).some((n) => n.toLowerCase() === institution));
  if (keyword) rows = rows.filter((r) => (r.keywords || []).some((k) => k.toLowerCase() === keyword));

  return ok(rows);
}
