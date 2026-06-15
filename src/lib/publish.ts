import "server-only";
import { updateProject, upsertRegistry } from "./store";
import { generateProjectDocs } from "./docgen/generator";
import { publishFiles, githubConfigured, repoInfo, type CommitFile } from "./github/service";
import { getStorageProvider } from "./storage";
import { notify } from "./email";
import {
  PUBLISHED_ROOT, projectFolderName, fileCategoryFolder, contributionFileName, slugify
} from "./constants";
import type { Project, RegistryRecord, ProjectVersion } from "./types";

const MAX_INLINE_BYTES = 25 * 1024 * 1024;

export class PublishError extends Error {
  status: number;
  constructor(message: string, status = 502) { super(message); this.status = status; }
}

/**
 * Publish (or re-publish) a project to GitHub in the project-centric layout and
 * update Firestore + the public registry. Used by curator approval AND by owner
 * "add files" (project evolution). Bumps the version and appends to history.
 */
export async function publishProject(p: Project, actorEmail: string): Promise<Project> {
  if (!githubConfigured()) throw new PublishError("GitHub is not configured (set GITHUB_TOKEN).", 503);

  const folder = projectFolderName(p.title);
  const slug = p.slug || slugify(p.title);
  const repoPath = `${PUBLISHED_ROOT}/${folder}`;
  const primaryAuthor = p.authors[0]?.name || p.contactName || "anon";

  const docs = await generateProjectDocs(p);

  const storage = getStorageProvider();
  const commitFiles: CommitFile[] = [
    { path: `${repoPath}/README.md`, content: docs.readme, encoding: "utf-8" },
    { path: `${repoPath}/AI_SUMMARY.md`, content: docs.summary, encoding: "utf-8" }
  ];
  const manifest: { name: string; category: string; path: string }[] = [];
  for (const file of p.files) {
    const catFolder = fileCategoryFolder(file.category);
    const name = contributionFileName(slug, primaryAuthor, file.name);
    const path = `${repoPath}/${catFolder}/${name}`;
    manifest.push({ name: file.name, category: file.category || "other", path });
    if (file.size > MAX_INLINE_BYTES) continue;
    try {
      const buf = await storage.get(file.storageKey);
      commitFiles.push({ path, content: buf.toString("base64"), encoding: "base64" });
    } catch (err) {
      console.warn(`[publish] could not fetch ${file.storageKey}; linking only`, err);
    }
  }

  const nextVersion = (p.version || 0) + 1;
  const metadata = {
    schema: "easer-project/2", id: p.id, title: p.title, folder, slug,
    description: p.description, purpose: p.purpose,
    authors: p.authors, institutions: p.institutions,
    contact: { name: p.contactName, email: p.contactEmail },
    keywords: p.keywords, license: p.license || null, version: nextVersion,
    files: manifest, publishedAt: new Date().toISOString(), source: "easer-research-data-hub"
  };
  commitFiles.push({ path: `${repoPath}/metadata.json`, content: JSON.stringify(metadata, null, 2), encoding: "utf-8" });

  const message = `${nextVersion > 1 ? "Update" : "Add"} project: ${p.title} (v${nextVersion})`;
  const prBody = `**Project:** ${p.title}\n**Authors:** ${p.authors.map((a) => a.name).join(", ")}\n**Institutions:** ${p.institutions.map((i) => i.name).join(", ")}\n\n${p.description}\n\n_Published via the EASER Research Data Hub by ${actorEmail}._`;

  const result = await publishFiles(commitFiles, message, {
    prBody, branchName: `project/${slug}-v${nextVersion}-${Date.now().toString(36)}`
  });

  const now = new Date().toISOString();
  const status = result.strategy === "pull_request" ? "approved" : "published";
  const version: ProjectVersion = {
    version: nextVersion, at: now,
    note: nextVersion > 1 ? "Updated project resources" : "Initial publication",
    fileCount: p.files.length, commitUrl: result.url
  };
  const updated = await updateProject(p.id,
    {
      status, repoPath, slug, version: nextVersion,
      history: [...(p.history || []), version],
      readme: docs.readme, summary: docs.summary,
      githubCommitUrl: result.url, githubPrNumber: result.prNumber, publishedAt: now
    },
    { at: now, actor: actorEmail, action: status, note: `v${nextVersion} · ${result.url}` });

  const reg: RegistryRecord = {
    id: p.id, title: p.title, category: p.category || "report",
    author: primaryAuthor, affiliation: p.institutions[0]?.name || "",
    authors: p.authors.map((a) => a.name), institutions: p.institutions.map((i) => i.name),
    year: new Date(p.submittedAt || p.createdAt || now).getFullYear(),
    description: p.description, keywords: p.keywords,
    repoPath, githubUrl: result.url, approvedAt: now, source: "project"
  };
  await upsertRegistry(reg);

  await notify({
    to: p.contactEmail,
    subject: `[EASER] "${p.title}" ${status === "published" ? "published" : "approved"} (v${nextVersion})`,
    text: result.strategy === "pull_request"
      ? `Your project "${p.title}" (v${nextVersion}) was approved and a pull request was opened in ${repoInfo.owner}/${repoInfo.repo}:\n${result.url}`
      : `Your project "${p.title}" (v${nextVersion}) has been published:\n${result.url}`
  });

  // Files are now in the repository tree; clear them from temporary staging.
  // (Only when committed directly to the default branch — under the PR strategy
  // the bytes are still needed until the PR is merged.)
  if (result.strategy === "commit") {
    await Promise.allSettled(p.files.map((file) => storage.delete(file.storageKey)));
  }

  return updated || p;
}
