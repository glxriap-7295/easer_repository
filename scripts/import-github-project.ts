/**
 * Import an external GitHub repository into EASER as a CANONICAL archive,
 * preserving structure and attribution — so EASER no longer just redirects to
 * someone's personal repo.
 *
 * It copies the source repo's files into:
 *     contributions/<slug>/<original structure>
 * and writes a README.md (with attribution) + metadata.json.
 *
 * Run where GITHUB_TOKEN + network exist:
 *   npx tsx scripts/import-github-project.ts \
 *     --source rodrigorojassanhueza/filtering-effect-response \
 *     --title "Filtering Effect Response" \
 *     --author "Rodrigo Rojas Sanhueza" \
 *     --institution "Universidad de Chile" \
 *     --category model            # optional
 *
 * Honors GITHUB_WRITE_STRATEGY (pull_request by default) so you review before merge.
 * Files larger than --max-mb (default 25) are skipped and listed in the README.
 */
import { Octokit } from "@octokit/rest";
import { publishFiles, type CommitFile } from "../src/lib/github/service";
import { slugify, CONTRIB_ROOT } from "../src/lib/constants";

function arg(name: string, def = ""): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

async function main() {
  const source = arg("source");
  if (!source.includes("/")) throw new Error("Provide --source owner/repo");
  const [sOwner, sRepo] = source.split("/");
  const title = arg("title", sRepo);
  const author = arg("author", sOwner);
  const institution = arg("institution", "");
  const category = arg("category", "resource");
  const maxBytes = Number(arg("max-mb", "25")) * 1024 * 1024;
  const slug = slugify(title);
  const base = `${CONTRIB_ROOT}/${slug}`;

  if (!process.env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN required");
  const gh = new Octokit({ auth: process.env.GITHUB_TOKEN });

  const repo = await gh.repos.get({ owner: sOwner, repo: sRepo });
  const branch = repo.data.default_branch;
  const head = await gh.repos.getBranch({ owner: sOwner, repo: sRepo, branch });
  const tree = await gh.git.getTree({ owner: sOwner, repo: sRepo, tree_sha: head.data.commit.commit.tree.sha, recursive: "true" });

  const files: CommitFile[] = [];
  const skipped: string[] = [];
  const included: string[] = [];
  for (const node of tree.data.tree) {
    if (node.type !== "blob" || !node.path) continue;
    if ((node.size || 0) > maxBytes) { skipped.push(node.path); continue; }
    const blob = await gh.git.getBlob({ owner: sOwner, repo: sRepo, file_sha: node.sha! });
    files.push({ path: `${base}/${node.path}`, content: blob.data.content, encoding: "base64" });
    included.push(node.path);
  }

  const now = new Date().toISOString();
  const sourceUrl = `https://github.com/${sOwner}/${sRepo}`;
  const readme = `# ${title}

> Imported into the EASER Research Repository · ${category}

## Authors
- ${author}

## Institutions
- ${institution || "Not specified."}

## Description
${repo.data.description || "Imported research project."}

## Attribution / Original source
This project was originally published at ${sourceUrl} and has been archived here,
preserving its structure, so that EASER serves as the canonical archive.
Original license/terms apply.

## Included Files
${included.map((f) => `- \`${f}\``).join("\n") || "_none_"}
${skipped.length ? `\n## Files too large to inline (kept at source)\n${skipped.map((f) => `- \`${f}\` — see ${sourceUrl}`).join("\n")}\n` : ""}
## Import Date
${now.slice(0, 10)}
`;
  const metadata = {
    schema: "easer-project/1", title, slug, category,
    authors: [{ name: author }], institutions: institution ? [{ name: institution }] : [],
    description: repo.data.description || "", importedFrom: sourceUrl,
    files: included, skippedLargeFiles: skipped, importDate: now, source: "github-import"
  };
  files.push({ path: `${base}/README.md`, content: readme, encoding: "utf-8" });
  files.push({ path: `${base}/metadata.json`, content: JSON.stringify(metadata, null, 2), encoding: "utf-8" });

  console.log(`Importing ${included.length} file(s) from ${sourceUrl} -> ${base}/ (${skipped.length} skipped)`);
  const res = await publishFiles(files, `Import project: ${title} (from ${source})`, {
    prBody: `Canonical import of ${sourceUrl} preserving structure and attribution to ${author}.`,
    branchName: `import/${slug}-${Date.now().toString(36)}`
  });
  console.log(`Done (${res.strategy}): ${res.url}`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
