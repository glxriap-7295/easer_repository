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

const ENV_OWNER = process.env.GITHUB_OWNER || "glxriap-7295";
const ENV_REPO = process.env.GITHUB_REPO || "easer_repository";
const ENV_BRANCH = process.env.GITHUB_DEFAULT_BRANCH || "main";

// Public, full view of a single published project (powers the project page).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const p = await getProject(params.id);
  if (!p || !PUBLIC.includes(p.status)) return fail("Not found", 404);

  const slug = p.slug || slugify(p.title);
  const primaryAuthor = p.authors?.[0]?.name || p.contactName || "anon";

  // Resolve the correct GitHub coordinates: an independent per-project repo
  // (repo strategy) commits at the root; the legacy monorepo uses repoPath.
  const isRepo = p.repo?.strategy === "repo";
  const owner = isRepo && p.repo?.owner ? p.repo.owner : ENV_OWNER;
  const repo = isRepo && p.repo?.name ? p.repo.name : ENV_REPO;
  const branch = isRepo ? (p.repo?.defaultBranch || "main") : ENV_BRANCH;
  const basePath = isRepo ? "" : (p.repoPath ? `${p.repoPath}/` : "");

  const resources = p.files.map((f) => {
    const folder = f.folder || fileCategoryFolder(f.category);
    const publishedName = contributionFileName(slug, primaryAuthor, f.name);
    const repoFilePath = `${basePath}${folder}/${publishedName}`;
    const canBuild = isRepo ? !!p.repo?.name : !!p.repoPath;
    const downloadUrl = f.url
      || (canBuild ? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${encodeURI(repoFilePath)}` : undefined);
    const githubUrl = canBuild ? `https://github.com/${owner}/${repo}/blob/${branch}/${encodeURI(repoFilePath)}` : undefined;
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
    projectType: p.projectType || "research",
    authors: p.authors, institutions: orderInstitutions(p.institutions),
    contactName: p.contactName, contactEmail: p.contactEmail,
    keywords: p.keywords, license: p.license,
    version: p.version || 1,
    readme: p.readme || buildReadme(p),
    summary: p.summary || buildSummary(p),
    resources,
    publications: p.publications || [],
    extraResources: p.resources || [],
    history: p.history || [],
    timeline: (p.audit || []).map((a) => ({ at: a.at, action: a.action })),
    repoPath: p.repoPath,
    repoUrl: p.repo?.url || p.githubCommitUrl,
    githubUrl: p.githubCommitUrl,
    publishedAt: p.publishedAt, createdAt: p.createdAt
  });
}
