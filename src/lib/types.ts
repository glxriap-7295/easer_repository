import type { Category, FileCategory, ContributionStatus, ProjectStatus } from "./constants";

/* ───────────────────────── Legacy (Phase 1) model ─────────────────────────
   Kept intact for backward compatibility. Existing `contributions` documents
   and their API routes continue to work unchanged. New work uses Project. */

export interface Submitter {
  name: string;
  email: string;
  affiliation: string;
  orcid?: string;
}

export interface ContributionMetadata {
  title: string;
  category: Category;
  description: string;
  purpose: string;
  dependencies?: string;
  requirements?: string;
  installation?: string;
  execution?: string;
  inputFiles?: string;
  outputFiles?: string;
  notes?: string;
  keywords: string[];
  license?: string;
  relatedLinks?: string[];
}

export interface UploadedFile {
  name: string;
  size: number;
  contentType: string;
  storageKey: string;
  url?: string;
  sha?: string;
  category?: FileCategory;            // file-level category (project-centric)
  metadata?: Record<string, string>; // optional per-file technical metadata
  folder?: string;                    // explicit repo folder (Repository Builder); overrides category folder
}

export interface ProjectVersion {
  version: number;
  at: string;
  note: string;
  fileCount: number;
  commitUrl?: string;
}

export interface DocumentationDraft {
  markdown: string;
  generatedBy: "template" | "anthropic";
  generatedAt: string;
  edited: boolean;
}

export interface AuditEntry {
  at: string;
  actor: string;
  action: string;
  note?: string;
}

export interface Contribution {
  id: string;
  status: ContributionStatus;
  submitter: Submitter;
  metadata: ContributionMetadata;
  files: UploadedFile[];
  draft?: DocumentationDraft;
  repoPath?: string;
  githubCommitUrl?: string;
  githubPrNumber?: number;
  reviewNote?: string;
  audit: AuditEntry[];
  createdAt: string;
  updatedAt: string;
}

/* ───────────────────────── Project model (Phase 3) ─────────────────────────
   One project → many files, many authors, many institutions. Owned by a
   researcher (ownerUid). Supports drafts (save & resume). */

export interface Author {
  name: string;
  email?: string;
  orcid?: string;
}

export interface Institution {
  name: string;
  department?: string;
}

export interface Project {
  id: string;
  status: ProjectStatus;
  ownerUid: string;

  // Core metadata
  title: string;
  category?: Category; // legacy/derived; categorization is now per-file
  description: string;
  purpose: string;

  // People & affiliation
  authors: Author[];
  institutions: Institution[];
  contactName: string;
  contactEmail: string;

  // Technical detail (all optional — README sections degrade gracefully)
  dependencies?: string;
  requirements?: string;
  installation?: string;
  execution?: string;
  inputFiles?: string;
  outputFiles?: string;
  notes?: string;
  keywords: string[];
  license?: string;
  relatedLinks?: string[];

  files: UploadedFile[];

  // RC1: classification, flexible resources, publications, repo target (all optional)
  projectType?: ProjectType;
  resources?: ProjectResource[];
  publications?: Publication[];
  repo?: RepoTarget;

  // Lifecycle artifacts
  slug?: string;
  subtitle?: string;   // optional short subtitle (editable)
  readme?: string;     // generated human-readable README
  summary?: string;    // Scientific Overview (generated, then editable)
  summaryEdited?: boolean; // true once a human edits the Scientific Overview → never auto-overwritten
  version?: number;
  history?: ProjectVersion[];
  draft?: DocumentationDraft;
  repoPath?: string;
  githubCommitUrl?: string;
  githubPrNumber?: number;
  reviewNote?: string;
  audit: AuditEntry[];

  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  publishedAt?: string;
}

/* ───────────────────────── Public registry ───────────────────────── */

export interface RegistryRecord {
  id: string;
  title: string;
  category: Category;
  author: string;          // primary author (back-compat)
  affiliation: string;     // first institution (back-compat)
  authors?: string[];      // all author names (Project)
  institutions?: string[]; // all institution names (Project)
  year?: number;
  description: string;
  keywords: string[];
  repoPath: string;
  githubUrl: string;
  approvedAt: string;
  source?: "contribution" | "project";
}

export interface RepoTreeNode {
  path: string;
  type: "blob" | "tree";
  size?: number;
  sha: string;
}

/* ───────────────────────── Institutional site (Team + News) ───────────────────────── */
export type TeamGroup = "director" | "subdirector" | "pi" | "researcher" | "associate" | "postdoc" | "grad" | "collaborator" | "team";

export interface TeamMember {
  id: string;
  name: string;
  group: TeamGroup;          // director | principal investigator | full team
  role: string;              // e.g. "Director", "Research Assistant", "Journalist"
  institution?: string;
  photoURL?: string;
  linkedin?: string;
  bio?: string;
  order: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  coverImage?: string;
  content: string;           // markdown / rich text
  authorName?: string;
  authorId?: string;
  tags: string[];
  status: "draft" | "published";
  pinned?: boolean;
  externalLinks?: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/* ───────────────────────── RC1: project classification, resources, publications, repo target ─────────────────────────
   All additive & optional — existing Project documents remain valid. */

export type ProjectType =
  | "research" | "computational_tool" | "dataset" | "publication"
  | "software" | "educational" | "field_campaign" | "reconnaissance" | "other";

export type ResourceKind =
  | "repository" | "publication" | "doi" | "documentation" | "presentation"
  | "video" | "image" | "dataset" | "software" | "model" | "external";

// A flexible resource attached to a project (extensible without redesign).
export interface ProjectResource {
  kind: ResourceKind;
  label: string;
  url?: string;              // external link (GitHub, DOI, video, storage provider…)
  description?: string;
  fileName?: string;         // when backed by an uploaded/committed file
  provider?: string;         // future: "github" | "designsafe" | "s3" | …
}

export interface Publication {
  title: string;
  authors?: string;
  journal?: string;
  publisher?: string;
  doi?: string;
  url?: string;              // official publication URL
  abstract?: string;
  access?: "open" | "restricted";
}

// Where a project's contents live on GitHub. `folder` = legacy single-repo
// (Published Projects/<name>/); `repo` = one independent repository per project.
export interface RepoTarget {
  strategy: "folder" | "repo";
  owner?: string;
  name?: string;             // repository name (repo strategy)
  url?: string;              // html url
  defaultBranch?: string;
  importedFrom?: string;     // source URL when the repo was imported
}

// Researcher-defined folder tree built in the Repository Builder (client-side)
// and materialised on GitHub only at publish time. Empty folders are dropped.
export interface RepoFolderNode {
  name: string;
  files: UploadedFile[];
}
