import { NextRequest } from "next/server";
import { getProject } from "@/lib/store";
import { buildSummary, buildReadme } from "@/lib/docgen/generator";
import { fileCategoryFolder, fileCategoryLabel, orderInstitutions } from "@/lib/constants";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
const PUBLIC = ["approved", "published"];

// Public, full view of a single published project (powers the project page).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const p = await getProject(params.id);
  if (!p || !PUBLIC.includes(p.status)) return fail("Not found", 404);

  const resources = p.files.map((f) => ({
    name: f.name, category: f.category || "other",
    categoryLabel: fileCategoryLabel(f.category), folder: fileCategoryFolder(f.category),
    metadata: f.metadata || {}, url: f.url
  }));

  return ok({
    id: p.id, title: p.title, description: p.description, purpose: p.purpose,
    authors: p.authors, institutions: orderInstitutions(p.institutions),
    contactName: p.contactName, contactEmail: p.contactEmail,
    keywords: p.keywords, license: p.license,
    version: p.version || 1,
    readme: p.readme || buildReadme(p),
    summary: p.summary || buildSummary(p),
    resources,
    history: p.history || [],
    timeline: (p.audit || []).map((a) => ({ at: a.at, action: a.action })),
    repoPath: p.repoPath, githubUrl: p.githubCommitUrl,
    publishedAt: p.publishedAt, createdAt: p.createdAt
  });
}
