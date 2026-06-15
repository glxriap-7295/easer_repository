import "server-only";
import type { Project, UploadedFile, Author, Institution } from "../types";
import { FILE_CATEGORIES, fileCategoryFolder, fileCategoryLabel, type FileCategory } from "../constants";

// ── Pluggable documentation generation ────────────────────────────────────
// Produces a human-readable README.md and a concise AI_SUMMARY.md for a project.
// No paid/cloud APIs. Order: Ollama (local) → Template (always available).
export interface ProjectDoc {
  readme: string;
  summary: string;
  generatedBy: string;
}

export interface DocumentationGenerator {
  readonly name: string;
  available(): Promise<boolean>;
  generate(project: Project): Promise<ProjectDoc>;
}

// ── helpers ────────────────────────────────────────────────────────────────
const orNone = (v?: string) => (v && v.trim() ? v.trim() : "—");
function cat(f: UploadedFile): FileCategory { return (f.category as FileCategory) || "other"; }
function byCategory(files: UploadedFile[]) {
  const map = new Map<FileCategory, UploadedFile[]>();
  for (const f of files) { const c = cat(f); if (!map.has(c)) map.set(c, []); map.get(c)!.push(f); }
  return map;
}
function authorsList(authors: Author[]) {
  return authors.length ? authors.map((a) => `${a.name}${a.orcid ? ` (ORCID ${a.orcid})` : ""}`).join("; ") : "—";
}
function institutionsList(institutions: Institution[]) {
  return institutions.length ? institutions.map((i) => `${i.name}${i.department ? ` — ${i.department}` : ""}`).join("; ") : "—";
}
function fileMeta(f: UploadedFile): string {
  if (!f.metadata) return "";
  const parts = Object.entries(f.metadata).filter(([, v]) => v && String(v).trim());
  return parts.length ? ` — ${parts.map(([k, v]) => `${k}: ${v}`).join("; ")}` : "";
}

// ── Template generator (deterministic, always available) ─────────────────────
export class TemplateDocumentationGenerator implements DocumentationGenerator {
  readonly name = "template";
  async available() { return true; }

  async generate(p: Project): Promise<ProjectDoc> {
    return { readme: buildReadme(p), summary: buildSummary(p), generatedBy: "template" };
  }
}

export function buildReadme(p: Project): string {
  const grouped = byCategory(p.files);
  const year = new Date(p.publishedAt || p.submittedAt || p.createdAt || Date.now()).getFullYear();
  const contents = FILE_CATEGORIES
    .filter((c) => grouped.get(c.value)?.length)
    .map((c) => `- **${c.folder}/** — ${grouped.get(c.value)!.length} file(s): ${c.description}`)
    .join("\n") || "_No files yet._";

  const fileDescriptions = FILE_CATEGORIES
    .filter((c) => grouped.get(c.value)?.length)
    .map((c) => {
      const items = grouped.get(c.value)!.map((f) => `- \`${c.folder}/${f.name}\`${fileMeta(f)}`).join("\n");
      return `### ${c.label}\n${items}`;
    }).join("\n\n") || "_No files yet._";

  const datasets = grouped.get("dataset") || [];
  const models = grouped.get("model") || [];
  const gis = grouped.get("gis") || [];
  const dataModels = (datasets.length || models.length || gis.length)
    ? [
        datasets.length ? `**Datasets (${datasets.length}):** ${datasets.map((f) => `\`${f.name}\``).join(", ")}` : "",
        models.length ? `**Models (${models.length}):** ${models.map((f) => `\`${f.name}\``).join(", ")}` : "",
        gis.length ? `**GIS layers (${gis.length}):** ${gis.map((f) => `\`${f.name}\``).join(", ")}` : ""
      ].filter(Boolean).join("\n\n")
    : "_No datasets or models are included in this project._";

  const start = grouped.get("report")?.length
    ? `Start with the report in **Reports/**, then review the data in **Datasets/** and the models in **Models/**.`
    : grouped.get("documentation")?.length
      ? `Start with **Documentation/**, then explore the available resources.`
      : `Read **AI_SUMMARY.md** for a quick overview, then browse the resource folders.`;

  return `# ${p.title}

## Project Overview
${orNone(p.description)}

${p.purpose ? `**Purpose.** ${p.purpose}\n` : ""}
## Repository Contents
${contents}

Each top-level folder groups resources of one type. \`README.md\` (this file), \`AI_SUMMARY.md\`, and \`metadata.json\` describe the project as a whole.

## How To Use This Repository
${start}

If you are new to this project, read **AI_SUMMARY.md** first — it explains the objective, methodology, and where to begin.

## File Descriptions
${fileDescriptions}

## Data & Models
${dataModels}

## Contributors
- **Authors:** ${authorsList(p.authors)}
- **Institutions:** ${institutionsList(p.institutions)}
- **Contact:** ${p.contactName || "—"}${p.contactEmail ? ` <${p.contactEmail}>` : ""}

## Citation Information
> ${p.authors.map((a) => a.name).join("; ") || "EASER contributors"} (${year}). *${p.title}*. EASER Research Repository${p.institutions[0]?.name ? `, ${p.institutions[0].name}` : ""}.

${p.license ? `**License:** ${p.license}\n` : ""}${p.version ? `**Version:** ${p.version}\n` : ""}
---
*Maintained through the EASER Research Data Hub. Documentation generated automatically and reviewed by a project curator.*
`;
}

export function buildSummary(p: Project): string {
  const grouped = byCategory(p.files);
  const counts = FILE_CATEGORIES.filter((c) => grouped.get(c.value)?.length)
    .map((c) => `${grouped.get(c.value)!.length} ${c.label.toLowerCase()}(s)`).join(", ") || "no files yet";
  const datasets = (grouped.get("dataset") || []).map((f) => f.name);
  const models = (grouped.get("model") || []).map((f) => f.name);
  const reports = (grouped.get("report") || []).map((f) => f.name);

  const methodology = [p.purpose, p.execution, p.installation].filter(Boolean).join(" ") ||
    "See the project resources and report(s) for methodological detail.";

  const start = reports.length ? `the report(s) in **Reports/**`
    : datasets.length ? `the data in **Datasets/**`
    : models.length ? `the model(s) in **Models/**`
    : `the resource folders`;

  return `# AI Summary — ${p.title}

## Objective
${orNone(p.description)}

## Methodology
${methodology}

## Available Resources
This project includes ${counts}.

## Datasets
${datasets.length ? datasets.map((d) => `- ${d}`).join("\n") : "_None included._"}

## Models
${models.length ? models.map((m) => `- ${m}`).join("\n") : "_None included._"}

## Key Outputs
${p.outputFiles ? p.outputFiles : reports.length ? reports.map((r) => `- ${r}`).join("\n") : "_See the resources above._"}

## Recommended Starting Point
A new researcher should begin with ${start}, then read the full **README.md**.

${p.keywords?.length ? `**Keywords:** ${p.keywords.join(", ")}\n` : ""}`;
}

// ── Ollama generator (local, optional) ───────────────────────────────────────
export class OllamaDocumentationGenerator implements DocumentationGenerator {
  readonly name = "ollama";
  private url = process.env.OLLAMA_URL || "http://localhost:11434";
  private model = process.env.OLLAMA_MODEL || "llama3.1";
  private fallback = new TemplateDocumentationGenerator();

  async available(): Promise<boolean> {
    try {
      const res = await fetch(`${this.url}/api/tags`, { signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch { return false; }
  }

  private async ask(prompt: string): Promise<string> {
    const res = await fetch(`${this.url}/api/generate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model: this.model, prompt, stream: false }),
      signal: AbortSignal.timeout(60000)
    });
    if (!res.ok) throw new Error(`Ollama ${res.status}`);
    const data = await res.json();
    const text = (data?.response || "").trim();
    if (!text) throw new Error("empty completion");
    return text;
  }

  async generate(p: Project): Promise<ProjectDoc> {
    // Build the deterministic template first; use it as both context and fallback.
    const base = await this.fallback.generate(p);
    if (!(await this.available())) return base;
    try {
      const facts = JSON.stringify({
        title: p.title, description: p.description, purpose: p.purpose,
        authors: p.authors, institutions: p.institutions, keywords: p.keywords,
        files: p.files.map((f) => ({ name: f.name, category: fileCategoryLabel(f.category), folder: fileCategoryFolder(f.category), metadata: f.metadata }))
      }, null, 2);
      const readme = await this.ask(
        `You are documenting a research project for the EASER seismic-risk repository. Using ONLY the facts below, write a clear, professional README.md in Markdown with these sections: Project Overview, Repository Contents, How To Use This Repository, File Descriptions, Data & Models, Contributors, Citation Information. Do not invent facts. Output only Markdown.\n\nFACTS:\n${facts}`
      );
      const summary = await this.ask(
        `Using ONLY these facts, write a concise AI_SUMMARY.md in Markdown with sections: Objective, Methodology, Available Resources, Datasets, Models, Key Outputs, Recommended Starting Point. Be faithful; do not invent. Output only Markdown.\n\nFACTS:\n${facts}`
      );
      return { readme, summary, generatedBy: `ollama:${this.model}` };
    } catch (err) {
      console.error("[docgen/ollama] falling back to template:", err);
      return base;
    }
  }
}

// ── Factory ──────────────────────────────────────────────────────────────────
export function getDocumentationGenerator(): DocumentationGenerator {
  const choice = (process.env.DOC_GENERATOR || "template").toLowerCase();
  if (choice === "ollama") return new OllamaDocumentationGenerator();
  return new TemplateDocumentationGenerator();
}

/** Generate docs with guaranteed template fallback (never throws). */
export async function generateProjectDocs(p: Project): Promise<ProjectDoc> {
  try {
    return await getDocumentationGenerator().generate(p);
  } catch (err) {
    console.error("[docgen] generator failed, using template:", err);
    return new TemplateDocumentationGenerator().generate(p);
  }
}
