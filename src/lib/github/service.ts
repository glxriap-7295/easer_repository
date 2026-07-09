import "server-only";
import { Octokit } from "@octokit/rest";
import type { RepoTreeNode } from "../types";

const OWNER = process.env.GITHUB_OWNER || "glxriap-7295";
const REPO = process.env.GITHUB_REPO || "easer_repository";
const DEFAULT_BRANCH = process.env.GITHUB_DEFAULT_BRANCH || "main";
const WRITE_STRATEGY = (process.env.GITHUB_WRITE_STRATEGY || "pull_request") as
  | "commit"
  | "pull_request";

export const githubConfigured = () => Boolean(process.env.GITHUB_TOKEN);

function client(): Octokit {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

export const repoInfo = { owner: OWNER, repo: REPO, defaultBranch: DEFAULT_BRANCH };

export function repoHtmlUrl(path = ""): string {
  return `https://github.com/${OWNER}/${REPO}/tree/${DEFAULT_BRANCH}/${path}`.replace(/\/$/, "");
}

/** List a directory (one level) of the repository. */
export async function listTree(path = ""): Promise<RepoTreeNode[]> {
  const gh = client();
  const { data } = await gh.repos.getContent({ owner: OWNER, repo: REPO, path });
  if (!Array.isArray(data)) {
    return [{ path: data.path, type: "blob", size: (data as any).size, sha: data.sha }];
  }
  return data
    .map((d) => ({
      path: d.path,
      type: d.type === "dir" ? ("tree" as const) : ("blob" as const),
      size: d.size,
      sha: d.sha
    }))
    .sort((a, b) => (a.type === b.type ? a.path.localeCompare(b.path) : a.type === "tree" ? -1 : 1));
}

/** Recursively list the whole tree (used for search). */
export async function listFullTree(): Promise<RepoTreeNode[]> {
  const gh = client();
  const branch = await gh.repos.getBranch({ owner: OWNER, repo: REPO, branch: DEFAULT_BRANCH });
  const sha = branch.data.commit.commit.tree.sha;
  const { data } = await gh.git.getTree({ owner: OWNER, repo: REPO, tree_sha: sha, recursive: "true" });
  return data.tree
    .filter((t) => t.path)
    .map((t) => ({
      path: t.path!,
      type: t.type === "tree" ? ("tree" as const) : ("blob" as const),
      size: t.size,
      sha: t.sha!
    }));
}

/** Fetch a single file's decoded text content. */
export async function getFile(path: string): Promise<{ content: string; sha: string }> {
  const gh = client();
  const { data } = await gh.repos.getContent({ owner: OWNER, repo: REPO, path });
  if (Array.isArray(data) || data.type !== "file") throw new Error("Not a file");
  return { content: Buffer.from(data.content, "base64").toString("utf8"), sha: data.sha };
}

export interface CommitFile {
  path: string;            // path inside the repo
  content: string;         // utf-8 or base64 (see `encoding`)
  encoding?: "utf-8" | "base64";
}

export interface PublishResult {
  strategy: "commit" | "pull_request";
  url: string;             // commit or PR html url
  branch: string;
  prNumber?: number;
}

/**
 * Publish a set of files to the repository as a single atomic change, using the
 * Git Data API (blobs → tree → commit). Honours GITHUB_WRITE_STRATEGY:
 *  - "commit": fast-forwards the default branch (use only if you trust review).
 *  - "pull_request": creates a branch + PR so the curator confirms on GitHub.
 */
export async function publishFiles(
  files: CommitFile[],
  message: string,
  opts: { strategy?: "commit" | "pull_request"; branchName?: string; prBody?: string } = {}
): Promise<PublishResult> {
  const gh = client();
  const strategy = opts.strategy || WRITE_STRATEGY;

  const ref = await gh.git.getRef({ owner: OWNER, repo: REPO, ref: `heads/${DEFAULT_BRANCH}` });
  const baseSha = ref.data.object.sha;
  const baseCommit = await gh.git.getCommit({ owner: OWNER, repo: REPO, commit_sha: baseSha });

  const blobs = await Promise.all(
    files.map(async (f) => {
      const blob = await gh.git.createBlob({
        owner: OWNER,
        repo: REPO,
        content: f.encoding === "base64" ? f.content : Buffer.from(f.content, "utf8").toString("base64"),
        encoding: "base64"
      });
      return { path: f.path, mode: "100644" as const, type: "blob" as const, sha: blob.data.sha };
    })
  );

  const tree = await gh.git.createTree({
    owner: OWNER,
    repo: REPO,
    base_tree: baseCommit.data.tree.sha,
    tree: blobs
  });

  const commit = await gh.git.createCommit({
    owner: OWNER,
    repo: REPO,
    message,
    tree: tree.data.sha,
    parents: [baseSha]
  });

  if (strategy === "commit") {
    await gh.git.updateRef({ owner: OWNER, repo: REPO, ref: `heads/${DEFAULT_BRANCH}`, sha: commit.data.sha });
    return { strategy, url: commit.data.html_url, branch: DEFAULT_BRANCH };
  }

  // pull_request strategy
  const branch = opts.branchName || `contribution/${Date.now()}`;
  await gh.git.createRef({ owner: OWNER, repo: REPO, ref: `refs/heads/${branch}`, sha: commit.data.sha });
  const pr = await gh.pulls.create({
    owner: OWNER,
    repo: REPO,
    title: message,
    head: branch,
    base: DEFAULT_BRANCH,
    body: opts.prBody || "Submitted via the EASER Research Data Hub."
  });
  return { strategy, url: pr.data.html_url, branch, prNumber: pr.data.number };
}

/* ───────────────────────── RC1: one repository per project + import ─────────────────────────
   The monorepo publishFiles() above is preserved for backwards compatibility.
   These functions add an independent-repository-per-project strategy and the
   ability to read (import) an existing repository WITHOUT modifying it. */

const ORG = process.env.GITHUB_ORG || ""; // if set, repos are created in this org
const REPO_PREFIX = process.env.GITHUB_REPO_PREFIX || "easer-";

export const repoOwnerDefault = ORG || OWNER;

export interface ProjectRepo {
  owner: string;
  name: string;
  url: string;
  defaultBranch: string;
  created: boolean;
}

/** Ensure a dedicated repository exists for a project (create if missing). */
export async function ensureProjectRepo(slug: string, description: string): Promise<ProjectRepo> {
  const gh = client();
  const name = `${REPO_PREFIX}${slug}`.slice(0, 90);
  const owner = ORG || OWNER;
  try {
    const { data } = await gh.repos.get({ owner, repo: name });
    return { owner, name: data.name, url: data.html_url, defaultBranch: data.default_branch, created: false };
  } catch (e: any) {
    if (e.status !== 404) throw e;
  }
  const created = ORG
    ? await gh.repos.createInOrg({ org: ORG, name, description: description.slice(0, 300), private: false, auto_init: true })
    : await gh.repos.createForAuthenticatedUser({ name, description: description.slice(0, 300), private: false, auto_init: true });
  return {
    owner: created.data.owner?.login || owner,
    name: created.data.name,
    url: created.data.html_url,
    defaultBranch: created.data.default_branch || "main",
    created: true
  };
}

/** Commit a full set of files to a specific repository's default branch. */
export async function commitToRepo(
  owner: string, repo: string, branch: string, files: CommitFile[], message: string
): Promise<string> {
  const gh = client();
  const ref = await gh.git.getRef({ owner, repo, ref: `heads/${branch}` });
  const baseSha = ref.data.object.sha;
  const baseCommit = await gh.git.getCommit({ owner, repo, commit_sha: baseSha });
  const blobs = await Promise.all(files.map(async (f) => {
    const blob = await gh.git.createBlob({
      owner, repo,
      content: f.encoding === "base64" ? f.content : Buffer.from(f.content, "utf8").toString("base64"),
      encoding: "base64"
    });
    return { path: f.path, mode: "100644" as const, type: "blob" as const, sha: blob.data.sha };
  }));
  const tree = await gh.git.createTree({ owner, repo, base_tree: baseCommit.data.tree.sha, tree: blobs });
  const commit = await gh.git.createCommit({ owner, repo, message, tree: tree.data.sha, parents: [baseSha] });
  await gh.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.data.sha });
  return commit.data.html_url;
}

/** Parse an owner/name pair from a GitHub URL or "owner/repo" string. */
export function parseRepoUrl(input: string): { owner: string; name: string } | null {
  const s = input.trim().replace(/\.git$/, "");
  const m = s.match(/github\.com[/:]([^/]+)\/([^/#?]+)/i) || s.match(/^([^/\s]+)\/([^/\s]+)$/);
  return m ? { owner: m[1], name: m[2] } : null;
}

export interface ImportedRepo {
  owner: string;
  name: string;
  url: string;
  description: string;
  defaultBranch: string;
  readme: string;
  tree: RepoTreeNode[];
}

/** Read an existing repository (structure + README) WITHOUT modifying it. */
export async function readRepo(owner: string, name: string): Promise<ImportedRepo> {
  const gh = client();
  const repo = await gh.repos.get({ owner, repo: name });
  const branch = repo.data.default_branch;
  const head = await gh.repos.getBranch({ owner, repo: name, branch });
  const treeRes = await gh.git.getTree({ owner, repo: name, tree_sha: head.data.commit.commit.tree.sha, recursive: "true" });
  const tree: RepoTreeNode[] = treeRes.data.tree.filter((t) => t.path).map((t) => ({
    path: t.path!, type: t.type === "tree" ? "tree" : "blob", size: t.size, sha: t.sha!
  }));
  let readme = "";
  try {
    const r = await gh.repos.getReadme({ owner, repo: name });
    readme = Buffer.from(r.data.content, "base64").toString("utf8");
  } catch { /* no README */ }
  return { owner, name: repo.data.name, url: repo.data.html_url, description: repo.data.description || "", defaultBranch: branch, readme, tree };
}
