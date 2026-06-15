// Central, human-editable configuration. Categories drive the UI dropdowns and
// the default repository folder a contribution is committed into.
export const APP_NAME = "EASER Research Data Hub";
export const APP_TAGLINE =
  "A unified interface for contributing to the EASER research repository — without needing to know Git.";

export const PARTNERS = [
  "Universidad de Chile",
  "SENAPRED",
  "ANID"
] as const;

export type Category =
  | "model"
  | "dataset"
  | "gis"
  | "report"
  | "documentation"
  | "script"
  | "resource";

export const CATEGORIES: { value: Category; label: string; repoDir: string; description: string }[] = [
  { value: "model", label: "Computational Model", repoDir: "models", description: "Simulation or computational models and their code." },
  { value: "dataset", label: "Scientific Dataset", repoDir: "datasets", description: "Tabular, time-series, or raw scientific data." },
  { value: "gis", label: "GIS / Spatial Data", repoDir: "gis", description: "Geospatial layers, shapefiles, rasters, maps." },
  { value: "report", label: "Research Report", repoDir: "reports", description: "Reports, papers, and PDFs." },
  { value: "documentation", label: "Documentation", repoDir: "docs", description: "Guides, protocols, and technical documentation." },
  { value: "script", label: "Script / Tool", repoDir: "scripts", description: "Processing scripts and utilities." },
  { value: "resource", label: "Technical Resource", repoDir: "resources", description: "Other supporting technical resources." }
];

export const CONTRIBUTION_STATUSES = [
  "submitted",
  "metadata_complete",
  "draft_generated",
  "in_review",
  "approved",
  "published",
  "rejected"
] as const;

export type ContributionStatus = (typeof CONTRIBUTION_STATUSES)[number];

export function categoryRepoDir(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.repoDir ?? "resources";
}

/* ───────────────────────── Project lifecycle (Phase 3+) ───────────────────────── */

export const PROJECT_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "published",
  "rejected"
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  changes_requested: "Changes Requested",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected"
};

// Root folder in the repository where project contributions are written.
// Project folders are primary (NOT organised by researcher or category).
export const CONTRIB_ROOT = process.env.GITHUB_CONTRIB_DIR || "contributions";

/** URL/path-safe slug, e.g. "Tsunami Hazard Study" -> "tsunami-hazard-study". */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "project";
}

/** Compact token for the primary author used in published filenames. */
export function authorSlug(name: string): string {
  return slugify(name).replace(/-/g, "");
}

/**
 * Published filename convention: <projectslug>_<primaryauthor>_<original>.
 * Example: tsunami-hazard-study_jdoe_report.pdf
 */
export function contributionFileName(projectSlug: string, primaryAuthor: string, original: string): string {
  const safeOriginal = original.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return `${projectSlug}_${authorSlug(primaryAuthor)}_${safeOriginal}`;
}

/* ───────────── Official EASER project facts (from proyectoeaser.cl) ─────────────
   Bilingual; selected by the active language. Only information published on the
   official EASER website is used here. */
export const EASER_INFO = {
  official: "https://www.proyectoeaser.cl/",
  contact: "contacto@proyectoeaser.cl",
  instagram: "https://www.instagram.com/proyecto.easer/",
  location: "Concepción, Chile",
  name: "EASER — Evolution Assessment of Seismic Risk",
  aboutTitle: { en: "About the EASER project", es: "Sobre el proyecto EASER" },
  mission: {
    en: "Protecting critical infrastructure against seismic disasters through advanced technology and tailored solutions.",
    es: "Protegiendo infraestructuras críticas contra desastres sísmicos mediante tecnología avanzada y soluciones personalizadas."
  },
  linesTitle: { en: "Lines of development", es: "Líneas de desarrollo" },
  lines: [
    { en: "Mitigation of earthquake-related disasters", es: "Mitigación de desastres asociados a terremotos" },
    { en: "Training and knowledge-transfer programs", es: "Programas de capacitación y transferencia de conocimiento" },
    { en: "Advanced assessment of seismic risk and its evolution over time", es: "Evaluación avanzada del riesgo sísmico y su evolución temporal" },
    { en: "Development of customized tools for risk management", es: "Desarrollo de herramientas personalizadas para la gestión de riesgos" }
  ] as { en: string; es: string }[],
  officialCta: { en: "Visit the official EASER site", es: "Visita el sitio oficial de EASER" }
};
