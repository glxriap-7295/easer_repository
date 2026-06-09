import { NextRequest } from "next/server";
import { listContributions, listRegistry } from "@/lib/store";
import { ok } from "@/lib/api";

export const runtime = "nodejs";

// Public-ish summary stats for the landing page and dashboard header.
export async function GET(_req: NextRequest) {
  const [all, registry] = await Promise.all([listContributions(), listRegistry()]);
  const byStatus: Record<string, number> = {};
  for (const c of all) byStatus[c.status] = (byStatus[c.status] || 0) + 1;
  return ok({
    total: all.length,
    published: registry.length,
    pendingReview: (byStatus["in_review"] || 0) + (byStatus["metadata_complete"] || 0),
    byStatus
  });
}
