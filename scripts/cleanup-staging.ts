/**
 * One-time repository cleanup: delete the legacy `.easer-uploads/` staging tree
 * (random f_* upload folders) from the GitHub repo. Safe — staging is now held
 * in Firestore, never in GitHub.
 *
 * Run where GITHUB_TOKEN + network exist:
 *   npx tsx scripts/cleanup-staging.ts            # dry run
 *   npx tsx scripts/cleanup-staging.ts --delete
 */
import { Octokit } from "@octokit/rest";

async function main() {
  const owner = process.env.GITHUB_OWNER || "glxriap-7295";
  const repo = process.env.GITHUB_REPO || "easer_repository";
  const branch = process.env.GITHUB_DEFAULT_BRANCH || "main";
  const dir = process.env.GITHUB_UPLOADS_DIR || ".easer-uploads";
  const doDelete = process.argv.includes("--delete");
  if (!process.env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN required");
  const gh = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const head = await gh.repos.getBranch({ owner, repo, branch });
  const tree = await gh.git.getTree({ owner, repo, tree_sha: head.data.commit.commit.tree.sha, recursive: "true" });
  const victims = tree.data.tree.filter((t) => t.type === "blob" && t.path?.startsWith(dir + "/"));
  console.log(`${victims.length} file(s) under ${dir}/`);
  victims.forEach((v) => console.log("  -", v.path));
  if (!doDelete) { console.log("\nDry run. Re-run with --delete to remove them."); return; }
  if (!victims.length) { console.log("Nothing to delete."); return; }

  // Build a new tree that removes the staging blobs (sha:null), commit, update ref.
  const removals = victims.map((v) => ({ path: v.path!, mode: "100644" as const, type: "blob" as const, sha: null as any }));
  const newTree = await gh.git.createTree({ owner, repo, base_tree: head.data.commit.commit.tree.sha, tree: removals });
  const commit = await gh.git.createCommit({
    owner, repo, message: `chore: remove legacy ${dir}/ staging artifacts`,
    tree: newTree.data.sha, parents: [head.data.commit.sha]
  });
  await gh.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: commit.data.sha });
  console.log(`Deleted ${victims.length} file(s). Commit: ${commit.data.html_url}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
