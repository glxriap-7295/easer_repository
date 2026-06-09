import type { Category, ContributionStatus } from "./constants";

export interface Submitter {
  name: string;
  email: string;
  affiliation: string;
  orcid?: string;
}

// Metadata collected from the researcher. This is the raw input the AI/template
// documentation generator turns into a README draft.
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

// A reference to an uploaded artifact. The actual bytes live in whatever the
// configured StorageProvider returns (Firebase Storage, GitHub, local, S3…).
export interface UploadedFile {
  name: string;
  size: number;
  contentType: string;
  storageKey: string;   // provider-specific key/path
  url?: string;         // optional public/temporary URL
  sha?: string;
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
  repoPath?: string;          // path inside easer_repository once published
  githubCommitUrl?: string;   // commit or PR URL after approval
  githubPrNumber?: number;
  reviewNote?: string;
  audit: AuditEntry[];
  createdAt: string;
  updatedAt: string;
}

// Public, denormalised registry record for an approved contribution.
export interface RegistryRecord {
  id: string;
  title: string;
  category: Category;
  author: string;
  affiliation: string;
  description: string;
  keywords: string[];
  repoPath: string;
  githubUrl: string;
  approvedAt: string;
}

export interface RepoTreeNode {
  path: string;
  type: "blob" | "tree";
  size?: number;
  sha: string;
}
