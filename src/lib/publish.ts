import "server-only";
import { updateProject, upsertRegistry } from "./store";
import { generateProjectDocs } from "./docgen/generator";
import {
  publishFiles, ensureProjectRepo, commitToRepo, githubConfigured, repoInfo, type CommitFile
} from "./github/service";
import { getStorageProvider } from "./storage";
import { notify } from "./email";
import {
  PUBLISHED_ROOT, projectFolderName, fileCategoryFolder, contributionFileName, slugify
} from "./constants";
import type { Project, RegistryRecord, ProjectVersion, RepoTarget } from "./types";

const MAX_INLINE_BYTES = 25 * 1024 * 1024;

export class PublishError extends Error {
  status: number;
  constructor(message: string, status = 502) { super(message); this.status = status; }
}

// Which GitHub topology to publish into. `repo` = one independent repository per
// project (RC1 target); `folder` = legacy monorepo (Published Projects/<name>/).
// Resolved per-project (p.repo.strategy) with an env default; folder stays the
// default so nothing changes until a project explicitly opts into `repo`.
function resolveTarget(p: Project): "repo" | "folder" {
  if (p.repo?.strategy) return p.repo.strategy;
  const env = (process.env.PUBLICATION_TARGET || "folder").toLowerCase();
  return env === "repo" ? "repo" : "folder";
}

/**
 * Publish (or re-publish) a project to GitHub and update Firestore + the public
 * registry. Supports two topologies behind one interface. Used by curator
 * approval AND owner "add files". Bumps the version and appends to history.
 */
export async function publishProject(p: Project, actorEmail: string): Promise<Project> {
  if (!githubConfigured()) throw new PublishError("GitHub is not configured (set GITHUB_TOKEN).", 503);

  const target = resolveTarget(p);
  const folder = projectFolderName(p.title);
  const slug = p.slug || slugify(p.title);
  const primaryAuthor = p.authors[0]?.name || p.contactName || "anon";
  const nextVersion = (p.version || 0) + 1;

  // For "folder" every path is prefixed with Published Projects/<name>/.
  // For "repo" the files sit at the repository root.
  const prefix = target === "repo" ? "" : `${PUBLISHED_ROOT}/${folder}/`;

  // Imported projects point at an EXISTING external repository — it must never be
  // modified. They publish "metadata only": we make the project public without
  // committing anything to GitHub.
  const isImported = !!p.repo?.importedFrom;

  const docs = await generateProjectDocs(p);
  // Preserve human-edited Scientific Overview (and the imported README) — never
  // overwrite them with freshly generated text.
  const finalSummary = p.summaryEdited && p.summary ? p.summary : docs.summary;
  const finalReadme = isImported && p.readme ? p.readme : docs.readme;

  const storage = getStorageProvider();
  const commitFiles: CommitFile[] = [
    { path: `${prefix}README.md`, content: finalReadme, encoding: "utf-8" },
    { path: `${prefix}AI_SUMMARY.md`, content: finalSummary, encoding: "utf-8" }
  ];
  const manifest: { name: string; category: string; path: string }[] = [];
  for (const file of p.files) {
    const catFolder = file.folder || fileCategoryFolder(file.category);
    const name = contributionFileName(slug, primaryAuthor, file.name);
    const path = `${prefix}${catFolder}/${name}`;
    manifest.push({ name: file.name, category: file.category || "other", path });
    if (file.size > MAX_INLINE_BYTES) continue;
    try {
      const buf = await storage.get(file.storageKey);
      commitFiles.push({ path, content: buf.toString("base64"), encoding: "base64" });
    } catch (err) {
      console.warn(`[publish] could not fetch ${file.storageKey}; linking only`, err);
    }
  }

  const metadata = {
    schema: "easer-project/3", id: p.id, title: p.title, slug,
    projectType: p.projectType || "research",
    description: p.description, purpose: p.purpose,
    authors: p.authors, institutions: p.institutions,
    contact: { name: p.contactName, email: p.contactEmail },
    keywords: p.keywords, license: p.license || null, version: nextVersion,
    publications: p.publications || [], resources: p.resources || [],
    files: manifest, publishedAt: new Date().toISOString(), source: "easer-platform"
  };
  commitFiles.push({ path: `${prefix}metadata.json`, content: JSON.stringify(metadata, null, 2), encoding: "utf-8" });

  const message = `${nextVersion > 1 ? "Update" : "Add"} project: ${p.title} (v${nextVersion})`;

  // ── Perform the GitHub write, per topology ─────────────────────────────────
  let commitUrl: string;
  let repoTarget: RepoTarget;
  let repoPath: string;
  let usedCommitStrategy: boolean;
  let prNumber: number | undefined;

  if (isImported) {
    // Make public WITHOUT touching the source repository (no commit).
    const owner = p.repo!.owner!, name = p.repo!.name!;
    commitUrl = p.repo?.url || p.githubCommitUrl || `https://github.com/${owner}/${name}`;
    repoTarget = { strategy: "repo", owner, name, url: p.repo?.url || commitUrl, defaultBranch: p.repo?.defaultBranch || "main", importedFrom: p.repo?.importedFrom };
    repoPath = "";
    usedCommitStrategy = true; // treat as published (public) immediately on approval
  } else if (target === "repo") {
    // Independent repository per project (create if missing, commit to its main).
    const repo = p.repo?.name
      ? { owner: p.repo.owner!, name: p.repo.name, url: p.repo.url!, defaultBranch: p.repo.defaultBranch || "main" }
      : await ensureProjectRepo(slug, p.description || p.title);
    commitUrl = await commitToRepo(repo.owner, repo.name, repo.defaultBranch, commitFiles, message);
    repoTarget = { strategy: "repo", owner: repo.owner, name: repo.name, url: (repo as any).url, defaultBranch: repo.defaultBranch, importedFrom: p.repo?.importedFrom };
    repoPath = "";
    usedCommitStrategy = true; // own repo → committed straight to main
    // keep the repo html url as the canonical "open in repository" link
    if (!repoTarget.url) repoTarget.url = `https://github.com/${repo.owner}/${repo.name}`;
  } else {
    const result = await publishFiles(commitFiles, message, {
      prBody: `**Project:** ${p.title}\n**Authors:** ${p.authors.map((a) => a.name).join(", ")}\n\n${p.description}\n\n_Published via the EASER Platform by ${actorEmail}._`,
      branchName: `project/${slug}-v${nextVersion}-${Date.now().toString(36)}`
    });
    commitUrl = result.url;
    prNumber = result.prNumber;
    usedCommitStrategy = result.strategy === "commit";
    repoPath = `${PUBLISHED_ROOT}/${folder}`;
    repoTarget = { strategy: "folder", owner: repoInfo.owner, name: repoInfo.repo, url: commitUrl, defaultBranch: repoInfo.defaultBranch };
  }

  const now = new Date().toISOString();
  const status = usedCommitStrategy ? "published" : "approved";
  const version: ProjectVersion = {
    version: nextVersion, at: now,
    note: nextVersion > 1 ? "Updated project resources" : "Initial publication",
    fileCount: p.files.length, commitUrl
  };
  const updated = await updateProject(p.id,
    {
      status, repoPath, slug, version: nextVersion, repo: repoTarget,
      history: [...(p.history || []), version],
      readme: finalReadme, summary: finalSummary,
      githubCommitUrl: commitUrl, githubPrNumber: prNumber, publishedAt: now
    },
    { at: now, actor: actorEmail, action: status, note: `v${nextVersion} · ${commitUrl}` });

  const reg: RegistryRecord = {
    id: p.id, title: p.title, category: p.category || "report",
    author: primaryAuthor, affiliation: p.institutions[0]?.name || "",
    authors: p.authors.map((a) => a.name), institutions: p.institutions.map((i) => i.name),
    year: new Date(p.submittedAt || p.createdAt || now).getFullYear(),
    description: p.description, keywords: p.keywords,
    repoPath, githubUrl: repoTarget.url || commitUrl, approvedAt: now, source: "project"
  };
  await upsertRegistry(reg);

  await notify({
    to: p.contactEmail,
    subject: `[EASER] "${p.title}" ${status === "published" ? "published" : "approved"} (v${nextVersion})`,
    text: status === "published"
      ? `Your project "${p.title}" (v${nextVersion}) has been published:\n${repoTarget.url || commitUrl}`
      : `Your project "${p.title}" (v${nextVersion}) was approved and a pull request was opened:\n${commitUrl}`
  });

  // Clear temporary staged bytes once they're safely committed to the branch.
  // Imported projects have no staged bytes (files link to the external repo).
  if (usedCommitStrategy && !isImported) {
    await Promise.allSettled(p.files.map((file) => storage.delete(file.storageKey)));
  }

  return updated || p;
}
