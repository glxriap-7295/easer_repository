import { NextRequest } from "next/server";
import { getProject } from "@/lib/store";
import { buildSummary, buildReadme } from "@/lib/docgen/generator";
import {
  fileCategoryFolder, fileCategoryLabel, orderInstitutions,
  contributionFileName, slugify
} from "@/lib/constants";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always read fresh data (no build-time caching)
const PUBLIC = ["approved", "published"];

const OWNER = process.env.GITHUB_OWNER || "glxriap-7295";
const REPO = process.env.GITHUB_REPO || "easer_repository";
const BRANCH = process.env.GITHUB_DEFAULT_BRANCH || "main";

// Public, full view of a single published project (powers the project page).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const p = await getProject(params.id);
  if (!p || !PUBLIC.includes(p.status)) return fail("Not found", 404);

  const slug = p.slug || slugify(p.title);
  const primaryAuthor = p.authors?.[0]?.name || p.contactName || "anon";

  // Best-effort GitHub URLs for each published file (resolve once the file is on
  // the branch — i.e. for direct commits or merged pull requests).
  const resources = p.files.map((f) => {
    const folder = fileCategoryFolder(f.category);
    const publishedName = contributionFileName(slug, primaryAuthor, f.name);
    const repoFilePath = p.repoPath ? `${p.repoPath}/${folder}/${publishedName}` : "";
    const downloadUrl = f.url
      || (repoFilePath ? `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${encodeURI(repoFilePath)}` : undefined);
    const githubUrl = repoFilePath ? `https://github.com/${OWNER}/${REPO}/blob/${BRANCH}/${encodeURI(repoFilePath)}` : undefined;
    return {
      name: f.name, category: f.category || "other",
      categoryLabel: fileCategoryLabel(f.category), folder,
      metadata: f.metadata || {}, size: f.size,
      isPdf: /\.pdf$/i.test(f.name),
      downloadUrl, githubUrl
    };
  });

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
