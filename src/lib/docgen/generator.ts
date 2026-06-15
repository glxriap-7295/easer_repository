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
function cat(f: UploadedFile): FileCategory { return (f.category as FileCategory) || "other"; }
function byCategory(files: UploadedFile[]) {
  const map = new Map<FileCategory, UploadedFile[]>();
  for (const f of files) { const c = cat(f); if (!map.has(c)) map.set(c, []); map.get(c)!.push(f); }
  return map;
}
function authorsSentence(authors: Author[]) {
  const names = authors.map((a) => a.name).filter(Boolean);
  if (!names.length) return "the EASER project team";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
function institutionsSentence(institutions: Institution[]) {
  const names = institutions.map((i) => i.name).filter(Boolean);
  if (!names.length) return "";
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
function metaInline(f: UploadedFile): string {
  if (!f.metadata) return "";
  const parts = Object.entries(f.metadata).filter(([, v]) => v && String(v).trim());
  return parts.length ? ` (${parts.map(([k, v]) => `${k}: ${v}`).join("; ")})` : "";
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
  const present = FILE_CATEGORIES.filter((c) => grouped.get(c.value)?.length);
  const year = new Date(p.publishedAt || p.submittedAt || p.createdAt || Date.now()).getFullYear();

  const overview = p.description?.trim()
    ? p.description.trim()
    : `${p.title} is a research project archived in the EASER repository.`;
  const why = p.purpose?.trim()
    ? p.purpose.trim()
    : "This archive preserves the project's resources so that other researchers can reproduce, build on, and cite the work.";

  // Repository contents (narrative list of folders that actually exist)
  const contents = present.length
    ? present.map((c) => `- **${c.folder}/** — ${grouped.get(c.value)!.length} item(s). ${c.description}`).join("\n")
    : "_No resource files have been added yet._";

  // Where to start (narrative reading order)
  const has = (v: FileCategory) => (grouped.get(v)?.length || 0) > 0;
  let start = "Begin with **AI_SUMMARY.md** for a one-minute overview of the project.";
  if (has("report")) start += " Then read the material in **Reports/**, which describes the study and its findings.";
  if (has("dataset")) start += " The underlying data is in **Datasets/**.";
  if (has("model")) start += " Analyses and simulations are in **Models/**.";
  if (has("gis")) start += " Spatial layers are in **GIS/**.";

  // How resources relate
  const relate = [
    has("dataset") && has("model") ? "The datasets serve as inputs to the models." : "",
    has("model") && has("report") ? "The models produce the results discussed in the reports." : "",
    has("dataset") && has("report") && !has("model") ? "The reports analyse and interpret the datasets." : "",
    has("gis") ? "GIS layers provide the spatial context for the analysis." : ""
  ].filter(Boolean).join(" ") || "Each folder groups a single type of resource; together they document the project end to end.";

  // File descriptions
  const fileDescriptions = present.map((c) => {
    const items = grouped.get(c.value)!.map((f) => `- \`${c.folder}/${f.name}\`${metaInline(f)}`).join("\n");
    return `### ${c.label}\n${items}`;
  }).join("\n\n") || "_No files yet._";

  // Requirements & dependencies — aggregate from model file metadata
  const models = grouped.get("model") || [];
  const reqLines = models.flatMap((f) => {
    const m = f.metadata || {};
    return [
      m.dependencies ? `- **${f.name}** dependencies: ${m.dependencies}` : "",
      m.installation ? `- **${f.name}** installation: ${m.installation}` : "",
      m.execution ? `- **${f.name}** execution: ${m.execution}` : ""
    ].filter(Boolean);
  });
  const requirements = reqLines.length ? reqLines.join("\n") : "No special software requirements are recorded for this project.";

  const institutionsTxt = institutionsSentence(p.institutions);

  return `# ${p.title}

${overview}

## What this project is
${overview}

## Why it exists
${why}

## Repository contents
This repository is organised into folders, each holding one type of resource:

${contents}

The project root also contains this **README.md**, an **AI_SUMMARY.md** (a one-minute overview), and **metadata.json** (machine-readable project metadata).

## Where to start
${start}

## How the resources relate
${relate}

## File descriptions
${fileDescriptions}

## Requirements & dependencies
${requirements}

## Contributors
This project was developed by ${authorsSentence(p.authors)}${institutionsTxt ? `, ${institutionsTxt}` : ""}.${p.contactName ? ` For questions, contact ${p.contactName}${p.contactEmail ? ` (${p.contactEmail})` : ""}.` : ""}

## Citation
> ${authorsSentence(p.authors)} (${year}). *${p.title}*. EASER Research Repository${p.institutions[0]?.name ? `, ${p.institutions[0].name}` : ""}.

${p.license ? `## License\n${p.license}\n\n` : ""}---
*Archived and documented through the EASER Research Data Hub${p.version ? ` · version ${p.version}` : ""}.*
`;
}

export function buildSummary(p: Project): string {
  const grouped = byCategory(p.files);
  const counts = FILE_CATEGORIES.filter((c) => grouped.get(c.value)?.length)
    .map((c) => `${grouped.get(c.value)!.length} ${c.label.toLowerCase()}(s)`).join(", ") || "no files yet";
  const datasets = (grouped.get("dataset") || []).map((f) => f.name);
  const models = (grouped.get("model") || []).map((f) => f.name);
  const reports = (grouped.get("report") || []).map((f) => f.name);

  const methodology = [p.purpose].filter(Boolean).join(" ") ||
    "See the reports and resources in this repository for methodological detail.";
  const start = reports.length ? "the report(s) in **Reports/**"
    : datasets.length ? "the data in **Datasets/**"
    : models.length ? "the model(s) in **Models/**"
    : "the resource folders";

  return `# AI Summary — ${p.title}

## Objective
${p.description?.trim() || "Research project archived in the EASER repository."}

## Methodology
${methodology}

## Available Resources
This project includes ${counts}.

## Key Outputs
${reports.length ? reports.map((r) => `- ${r}`).join("\n") : "See the resources above for the project's outputs."}

## Recommended Starting Point
A researcher new to this project should begin with ${start}, then consult the full **README.md**.

${p.keywords?.length ? `_Keywords: ${p.keywords.join(", ")}._\n` : ""}`;
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
    const base = await this.fallback.generate(p);
    if (!(await this.available())) return base;
    try {
      const facts = JSON.stringify({
        title: p.title, description: p.description, purpose: p.purpose,
        authors: p.authors, institutions: p.institutions, keywords: p.keywords,
        files: p.files.map((f) => ({ name: f.name, category: fileCategoryLabel(f.category), folder: fileCategoryFolder(f.category), metadata: f.metadata }))
      }, null, 2);
      const readme = await this.ask(
        `You are writing project documentation for the EASER seismic-risk research repository. Using ONLY the facts below, write a human-readable README.md in Markdown that reads like documentation (prose, not a form). Cover: what the project is, why it exists, repository contents (the folders), where to start, how datasets/models/reports/GIS relate, file descriptions, requirements/dependencies, contributors, and citation. Do not invent facts. Output only Markdown.\n\nFACTS:\n${facts}`
      );
      const summary = await this.ask(
        `Using ONLY these facts, write a concise AI_SUMMARY.md (Markdown) a researcher can read in under a minute, with sections: Objective, Methodology, Available Resources, Key Outputs, Recommended Starting Point. Be faithful; do not invent. Output only Markdown.\n\nFACTS:\n${facts}`
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
