import { listProjects } from "@/lib/store";
import { ok } from "@/lib/api";
import { orderInstitutions } from "@/lib/constants";
import type { Project } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always read fresh data (no build-time caching)

const PUBLIC = ["approved", "published"];

function toCard(p: Project) {
  return {
    id: p.id, title: p.title, description: p.description,
    authors: p.authors.map((a) => a.name),
    institutions: orderInstitutions(p.institutions).map((i) => i.name),
    keywords: p.keywords, version: p.version || 1,
    fileCount: p.files.length, githubUrl: p.githubCommitUrl,
    publishedAt: p.publishedAt || p.updatedAt,
    year: new Date(p.publishedAt || p.createdAt || Date.now()).getFullYear()
  };
}

// Public list of published projects (project-centric browse).
export async function GET() {
  const rows = (await listProjects()).filter((p) => PUBLIC.includes(p.status));
  rows.sort((a, b) => (b.publishedAt || b.updatedAt).localeCompare(a.publishedAt || a.updatedAt));
  return ok(rows.map(toCard));
}
