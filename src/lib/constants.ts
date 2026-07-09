// Central, human-editable configuration. Categories drive the UI dropdowns and
// the default repository folder a contribution is committed into.
export const APP_NAME = "EASER Research Data Hub";
export const APP_TAGLINE =
  "A unified interface for contributing to the EASER research repository — without needing to know Git.";

// Canonical institution display order (Priority 1). Used everywhere institutions
// are shown so ordering is consistent and never alphabetical.
export const INSTITUTION_ORDER: { canonical: string; short: string; aliases: string[]; logoPath: string }[] = [
  { canonical: "Universidad de Concepción", short: "UDEC", aliases: ["udec", "concepcion", "concepción", "universidad de concepcion"], logoPath: "/logos/udec.png" },
  { canonical: "Pontificia Universidad Católica de Chile", short: "PUC", aliases: ["puc", "uc", "catolica", "católica", "pontificia"], logoPath: "/logos/puc.png" },
  { canonical: "Universidad de Chile", short: "U. de Chile", aliases: ["uchile", "u. de chile", "universidad de chile"], logoPath: "/logos/uchile.jpg" },
  { canonical: "SENAPRED", short: "SENAPRED", aliases: ["senapred"], logoPath: "/logos/senapred.png" },
  { canonical: "VMB Ingeniería Estructural", short: "VMB", aliases: ["vmb", "vmb ingenieria estructural", "vmb ingeniería estructural"], logoPath: "/logos/vmb.png" },
  { canonical: "ANID", short: "ANID", aliases: ["anid"], logoPath: "/logos/anid.png" }
];

export const PARTNERS = INSTITUTION_ORDER.map((i) => i.canonical);

/** Rank of an institution name in the canonical order; unknown names sort last. */
export function institutionRank(name?: string): number {
  if (!name) return INSTITUTION_ORDER.length + 1;
  const n = name.trim().toLowerCase();
  for (let i = 0; i < INSTITUTION_ORDER.length; i++) {
    const inst = INSTITUTION_ORDER[i];
    if (n === inst.canonical.toLowerCase() || inst.aliases.some((a) => n === a || n.includes(a))) return i;
  }
  return INSTITUTION_ORDER.length;
}

export function compareInstitutions(a?: string, b?: string): number {
  const ra = institutionRank(a), rb = institutionRank(b);
  return ra !== rb ? ra - rb : (a || "").localeCompare(b || "");
}

/** Order a list of institution names (strings or {name}) by the canonical rule. */
export function orderInstitutions<T extends string | { name: string }>(list: T[]): T[] {
  const nameOf = (x: T) => (typeof x === "string" ? x : x.name);
  return [...list].sort((a, b) => compareInstitutions(nameOf(a), nameOf(b)));
}

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
export function authorInitials(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  const ini = parts.slice(0, 3).map((p) => p[0]).join("").toLowerCase().replace(/[^a-z0-9]/g, "");
  return ini || "x";
}

export function contributionFileName(projectSlug: string, primaryAuthor: string, original: string): string {
  const safeOriginal = original.replace(/[^a-zA-Z0-9._-]+/g, "_");
  return `${projectSlug}_${authorInitials(primaryAuthor)}_${safeOriginal}`;
}

/* ───────────── Official EASER project facts (from proyectoeaser.cl) ─────────────
   Bilingual; selected by the active language. Only information published on the
   official EASER website is used here. */
export const EASER_INFO = {
  official: "https://www.proyectoeaser.cl/",
  contact: "easer@udec.cl",
  instagram: "https://www.instagram.com/proyecto.easer/",
  social: {
    instagram: "https://www.instagram.com/proyecto.easer/",
    linkedin: "",
    youtube: "",
    spotify: ""
  } as Record<string, string>,
  location: "Concepción, Chile",
  name: "EASER — Evolution Assessment of Seismic Risk",
  aboutTitle: { en: "About the EASER project", es: "Sobre el proyecto EASER" },
  mission: {
    en: "EASER is a collaborative, ANID-funded research initiative advancing the scientific understanding of how seismic risk evolves over time — and sharing open data, computational tools and knowledge to strengthen infrastructure resilience in Chile.",
    es: "EASER es una iniciativa de investigación colaborativa financiada por ANID que avanza en la comprensión científica de cómo evoluciona el riesgo sísmico en el tiempo, compartiendo datos abiertos, herramientas computacionales y conocimiento para fortalecer la resiliencia de la infraestructura en Chile."
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

/* ───────────── File-level categories (project-centric repository) ─────────────
   Categories are per FILE (not per project). Each maps to a human-readable
   folder in the published project so a non-programmer can navigate it. */
export type FileCategory =
  | "report" | "dataset" | "model" | "gis" | "presentation" | "documentation" | "other";

export const FILE_CATEGORIES: {
  value: FileCategory; label: string; folder: string; description: string;
}[] = [
  { value: "report", label: "Research Report", folder: "Reports", description: "Reports, papers, manuscripts (PDF, DOCX)." },
  { value: "dataset", label: "Dataset", folder: "Datasets", description: "Tabular, time-series or raw scientific data." },
  { value: "model", label: "Computational Model", folder: "Models", description: "Models, simulation code, notebooks." },
  { value: "gis", label: "GIS Layer", folder: "GIS", description: "Geospatial layers, shapefiles, rasters, maps." },
  { value: "presentation", label: "Presentation", folder: "Presentations", description: "Slides and presentation material." },
  { value: "documentation", label: "Documentation", folder: "Documentation", description: "Guides, protocols, technical docs." },
  { value: "other", label: "Other", folder: "Other", description: "Any other supporting resource." }
];

export function fileCategoryFolder(value?: string): string {
  return FILE_CATEGORIES.find((c) => c.value === value)?.folder ?? "Other";
}
export function fileCategoryLabel(value?: string): string {
  return FILE_CATEGORIES.find((c) => c.value === value)?.label ?? "Other";
}

// Optional technical-metadata fields shown dynamically per file category.
export const FILE_METADATA_FIELDS: Record<FileCategory, { key: string; label: string }[]> = {
  dataset: [
    { key: "variables", label: "Variables" },
    { key: "collectionMethod", label: "Collection method" },
    { key: "timeRange", label: "Time range" }
  ],
  model: [
    { key: "dependencies", label: "Dependencies" },
    { key: "installation", label: "Installation" },
    { key: "execution", label: "Execution instructions" }
  ],
  gis: [
    { key: "coordinateSystem", label: "Coordinate system" },
    { key: "spatialCoverage", label: "Spatial coverage" }
  ],
  report: [
    { key: "authors", label: "Authors" },
    { key: "journal", label: "Journal / venue" },
    { key: "doi", label: "DOI" },
    { key: "publicationLink", label: "Official publication link" }
  ],
  presentation: [],
  documentation: [],
  other: []
};

// Root folder for published, project-centric content (human-readable).
export const PUBLISHED_ROOT = process.env.GITHUB_PUBLISHED_ROOT || "Published Projects";

/** Human-readable, filesystem-safe project folder name (keeps spaces). */
export function projectFolderName(title: string): string {
  return (title || "Untitled Project")
    .replace(/[\/\\:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "Untitled Project";
}

/* ───────────── EASER research content (from the 2024 research proposal) ───────────── */
export const EASER_TAGLINE = {
  en: "Research for a seismically resilient Chile",
  es: "Investigación para un Chile sísmicamente resiliente"
};

export const EASER_ABSTRACT = {
  en: "EASER (Evolution Assessment of Seismic Risk) is an ANID-funded research initiative developing a methodology to assess how seismic risk evolves over time. By integrating seismology, geotechnical and structural engineering, EASER studies the time-dependency of seismic hazard, structural vulnerability and urban exposure to help public and private stakeholders make informed, time-aware risk-mitigation decisions for resilient communities.",
  es: "EASER (Evolution Assessment of Seismic Risk) es una iniciativa de investigación financiada por ANID que desarrolla una metodología para evaluar cómo evoluciona el riesgo sísmico en el tiempo. Integrando sismología e ingeniería geotécnica y estructural, EASER estudia la dependencia temporal de la amenaza sísmica, la vulnerabilidad estructural y la exposición urbana para apoyar decisiones informadas de mitigación del riesgo."
};

// Four research lines (RL1–RL4) derived directly from the proposal.
export const RESEARCH_THEMES: { title: { en: string; es: string }; desc: { en: string; es: string } }[] = [
  {
    title: { en: "Time-evolution of seismic hazard", es: "Evolución temporal de la amenaza sísmica" },
    desc: { en: "Time-dependent probabilistic hazard models for the Andean subduction context — earthquake recurrence, source and path characteristics, and site-response effects.", es: "Modelos probabilísticos de amenaza dependientes del tiempo para el contexto de subducción andino: recurrencia, características de la fuente y del trayecto, y efectos de sitio." }
  },
  {
    title: { en: "Time-evolution of seismic vulnerability", es: "Evolución temporal de la vulnerabilidad" },
    desc: { en: "Time-dependent fragility functions for Chilean reinforced-concrete and masonry typologies, accounting for cumulative earthquake damage and material degradation.", es: "Funciones de fragilidad dependientes del tiempo para tipologías chilenas de hormigón armado y albañilería, considerando daño acumulado y degradación de materiales." }
  },
  {
    title: { en: "Time-evolution of exposure", es: "Evolución temporal de la exposición" },
    desc: { en: "Modelling how urban residential exposure changes over time using aerophotogrammetry, satellite imagery and public building data — with forecasting capability.", es: "Modelación de cómo cambia la exposición residencial urbana en el tiempo usando aerofotogrametría, imágenes satelitales y datos públicos de edificaciones, con capacidad de pronóstico." }
  },
  {
    title: { en: "Computational tools for time-dependent risk", es: "Herramientas computacionales para el riesgo dependiente del tiempo" },
    desc: { en: "The EASER model: open, transparent computational tools that integrate hazard, vulnerability and exposure to evaluate risk-mitigation strategies, published openly.", es: "El modelo EASER: herramientas computacionales abiertas y transparentes que integran amenaza, vulnerabilidad y exposición para evaluar estrategias de mitigación, publicadas abiertamente." }
  }
];

export const EASER_OBJECTIVES: { en: string; es: string }[] = [
  { en: "Develop time-dependent seismic hazard models within the Andean subduction context.", es: "Desarrollar modelos de amenaza sísmica dependientes del tiempo en el contexto de subducción andino." },
  { en: "Evaluate the evolution of structural vulnerability through analytical and experimental approaches.", es: "Evaluar la evolución de la vulnerabilidad estructural mediante enfoques analíticos y experimentales." },
  { en: "Assess the temporal evolution of exposure from public databases and satellite image recognition.", es: "Evaluar la evolución temporal de la exposición a partir de bases de datos públicas y reconocimiento de imágenes satelitales." },
  { en: "Build computational tools to evaluate time-dependent seismic risk and propagate its uncertainties.", es: "Construir herramientas computacionales para evaluar el riesgo sísmico dependiente del tiempo y propagar sus incertidumbres." }
];

// Case-study regions (study areas only — EASER represents Chile as a whole).
export const STUDY_AREAS = ["Concepción", "Santiago", "Viña del Mar"];

export function institutionLogo(name?: string): string | undefined {
  if (!name) return undefined;
  const n = name.trim().toLowerCase();
  const hit = INSTITUTION_ORDER.find((i) => i.canonical.toLowerCase() === n || i.aliases.some((a) => n === a || n.includes(a)));
  return hit?.logoPath;
}

/* ───────────── Team role groups (Priority 5) — ordered, dynamic taxonomy ───────────── */
export const TEAM_GROUPS: { value: string; order: number; label: { en: string; es: string } }[] = [
  { value: "director", order: 1, label: { en: "Director", es: "Director" } },
  { value: "subdirector", order: 2, label: { en: "Subdirector", es: "Subdirector" } },
  { value: "pi", order: 3, label: { en: "Principal Investigators", es: "Investigadores Principales" } },
  { value: "researcher", order: 4, label: { en: "Researchers", es: "Investigadores" } },
  { value: "associate", order: 5, label: { en: "Associate Researchers", es: "Investigadores Asociados" } },
  { value: "postdoc", order: 6, label: { en: "Postdoctoral Researchers", es: "Investigadores Postdoctorales" } },
  { value: "grad", order: 7, label: { en: "Graduate Students & Research Assistants", es: "Estudiantes de Posgrado y Ayudantes" } },
  { value: "collaborator", order: 8, label: { en: "Other Contributors", es: "Otros Colaboradores" } },
  { value: "team", order: 9, label: { en: "Research Team", es: "Equipo de Investigación" } }
];
export function teamGroupLabel(value: string, lang: "en" | "es"): string {
  return TEAM_GROUPS.find((g) => g.value === value)?.label[lang] || value;
}

/* ───────────── RC1: project classification + resource kinds ───────────── */
export const PROJECT_TYPES: { value: string; label: { en: string; es: string } }[] = [
  { value: "research", label: { en: "Research Project", es: "Proyecto de investigación" } },
  { value: "computational_tool", label: { en: "Computational Tool", es: "Herramienta computacional" } },
  { value: "dataset", label: { en: "Dataset", es: "Conjunto de datos" } },
  { value: "publication", label: { en: "Publication", es: "Publicación" } },
  { value: "software", label: { en: "Software Package", es: "Paquete de software" } },
  { value: "educational", label: { en: "Educational Resource", es: "Recurso educativo" } },
  { value: "field_campaign", label: { en: "Field Campaign", es: "Campaña de terreno" } },
  { value: "reconnaissance", label: { en: "Reconnaissance", es: "Reconocimiento" } }
];
export function projectTypeLabel(value: string | undefined, lang: "en" | "es"): string {
  return PROJECT_TYPES.find((t) => t.value === value)?.label[lang] || (lang === "es" ? "Proyecto de investigación" : "Research Project");
}

export const RESOURCE_KINDS: { value: string; label: { en: string; es: string } }[] = [
  { value: "repository", label: { en: "GitHub Repository", es: "Repositorio GitHub" } },
  { value: "publication", label: { en: "Publication", es: "Publicación" } },
  { value: "doi", label: { en: "DOI", es: "DOI" } },
  { value: "documentation", label: { en: "Documentation", es: "Documentación" } },
  { value: "presentation", label: { en: "Presentation", es: "Presentación" } },
  { value: "video", label: { en: "Video", es: "Video" } },
  { value: "image", label: { en: "Image", es: "Imagen" } },
  { value: "dataset", label: { en: "Dataset", es: "Conjunto de datos" } },
  { value: "software", label: { en: "Software", es: "Software" } },
  { value: "model", label: { en: "Computational Model", es: "Modelo computacional" } },
  { value: "external", label: { en: "External Resource", es: "Recurso externo" } }
];

// Suggested repository folders offered in the Repository Builder (researcher may
// add unlimited custom folders). Only folders with files are created on GitHub.
export const SUGGESTED_FOLDERS = [
  "Documentation", "Results", "Computational Models", "Data",
  "Publications", "Scripts", "Images", "Videos", "Notebooks", "Resources"
];

// EASER organization on GitHub (social + future one-repo-per-project home).
export const GITHUB_ORG_URL = process.env.NEXT_PUBLIC_GITHUB_ORG_URL || "https://github.com/glxriap-7295";

// Heuristic category from a filename/folder (used when importing existing repos).
export function inferFileCategory(name: string, folder?: string): FileCategory {
  const f = (folder || "").toLowerCase();
  const n = name.toLowerCase();
  if (/report|paper|manuscript|publication/.test(f) || /\.(pdf|docx?|tex)$/.test(n)) return "report";
  if (/data|dataset|datos/.test(f) || /\.(csv|tsv|xlsx?|json|parquet|nc|h5)$/.test(n)) return "dataset";
  if (/model|simulation|notebook|code|script/.test(f) || /\.(py|ipynb|m|jl|r|cpp|c|f90)$/.test(n)) return "model";
  if (/gis|spatial|map/.test(f) || /\.(shp|geojson|kml|tif|tiff|gpkg)$/.test(n)) return "gis";
  if (/present|slide/.test(f) || /\.(pptx?|key)$/.test(n)) return "presentation";
  if (/doc|guide|manual|readme/.test(f) || /\.(md|rst|txt)$/.test(n)) return "documentation";
  return "other";
}
