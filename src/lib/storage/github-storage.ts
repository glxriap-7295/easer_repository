import "server-only";
import crypto from "crypto";
import { Octokit } from "@octokit/rest";
import type { StorageProvider, PutResult } from "./provider";

// GitHub-backed storage. Draft uploads are committed to a staging directory in
// the repository (separate from published `contributions/`). This needs only
// GITHUB_TOKEN — no Firebase Storage / billing — and keeps GitHub as the
// canonical archive. On approval, files are copied into contributions/<slug>/.
const OWNER = process.env.GITHUB_OWNER || "glxriap-7295";
const REPO = process.env.GITHUB_REPO || "easer_repository";
const BRANCH = process.env.GITHUB_UPLOADS_BRANCH || process.env.GITHUB_DEFAULT_BRANCH || "main";
const STAGING_DIR = process.env.GITHUB_UPLOADS_DIR || ".easer-uploads";

function client(): Octokit {
  return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

// Keep the repo path tidy/predictable. Callers pass keys like
// "uploads/f_abc/My File.csv"; we namespace them under the staging dir.
function repoPath(key: string): string {
  const clean = key.replace(/^\/+/, "");
  return clean.startsWith(STAGING_DIR + "/") ? clean : `${STAGING_DIR}/${clean}`;
}

export class GitHubStorageProvider implements StorageProvider {
  readonly name = "github";

  async put(key: string, data: Buffer, contentType: string): Promise<PutResult> {
    if (!process.env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN not configured");
    const path = repoPath(key);
    const gh = client();
    const { data: res } = await gh.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path,
      branch: BRANCH,
      message: `chore(uploads): stage ${path}`,
      content: data.toString("base64")
    });
    const sha = res.content?.sha || crypto.createHash("sha256").update(data).digest("hex");
    return {
      storageKey: path,
      url: res.content?.download_url || `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${encodeURI(path)}`,
      sha,
      size: data.length,
      contentType
    };
  }

  async get(key: string): Promise<Buffer> {
    const gh = client();
    const { data } = await gh.repos.getContent({ owner: OWNER, repo: REPO, path: repoPath(key), ref: BRANCH });
    if (Array.isArray(data) || data.type !== "file") throw new Error("Not a file");
    return Buffer.from(data.content, "base64");
  }

  async getUrl(key: string): Promise<string | undefined> {
    return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${encodeURI(repoPath(key))}`;
  }

  async delete(key: string): Promise<void> {
    const gh = client();
    const path = repoPath(key);
    try {
      const { data } = await gh.repos.getContent({ owner: OWNER, repo: REPO, path, ref: BRANCH });
      if (Array.isArray(data) || data.type !== "file") return;
      await gh.repos.deleteFile({ owner: OWNER, repo: REPO, path, branch: BRANCH, message: `chore(uploads): remove ${path}`, sha: data.sha });
    } catch {
      /* already gone */
    }
  }
}
