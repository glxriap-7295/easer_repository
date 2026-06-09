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
