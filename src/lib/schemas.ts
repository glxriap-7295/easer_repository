import { z } from "zod";

export const submitterSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("A valid email is required"),
  affiliation: z.string().min(2, "Affiliation is required"),
  orcid: z.string().optional()
});

export const metadataSchema = z.object({
  title: z.string().min(3, "Title is required"),
  category: z.enum(["model", "dataset", "gis", "report", "documentation", "script", "resource"]),
  description: z.string().min(10, "Please describe the contribution"),
  purpose: z.string().min(5, "Please describe the purpose"),
  dependencies: z.string().optional(),
  requirements: z.string().optional(),
  installation: z.string().optional(),
  execution: z.string().optional(),
  inputFiles: z.string().optional(),
  outputFiles: z.string().optional(),
  notes: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  license: z.string().optional(),
  relatedLinks: z.array(z.string()).optional()
});

export const uploadedFileSchema = z.object({
  name: z.string(),
  size: z.number(),
  contentType: z.string(),
  storageKey: z.string(),
  url: z.string().optional(),
  sha: z.string().optional(),
  category: z.enum(["report", "dataset", "model", "gis", "presentation", "documentation", "other"]).optional(),
  metadata: z.record(z.string()).optional(),
  folder: z.string().optional()
});

export const createContributionSchema = z.object({
  submitter: submitterSchema,
  metadata: metadataSchema,
  files: z.array(uploadedFileSchema).default([])
});

export type CreateContributionInput = z.infer<typeof createContributionSchema>;

/* ───────────────────────── Project schemas (Phase 3) ───────────────────────── */

export const authorSchema = z.object({
  name: z.string().min(1, "Author name required"),
  email: z.string().email().optional().or(z.literal("")),
  orcid: z.string().optional()
});

export const institutionSchema = z.object({
  name: z.string().min(1, "Institution name required"),
  department: z.string().optional()
});

// Lenient schema for saving drafts — only a title is required.
export const draftProjectSchema = z.object({
  title: z.string().min(1, "A title is required to save a draft"),
  projectType: z.string().optional(),
  category: z.enum(["model", "dataset", "gis", "report", "documentation", "script", "resource"]).default("model"),
  description: z.string().optional().default(""),
  purpose: z.string().optional().default(""),
  authors: z.array(authorSchema).default([]),
  institutions: z.array(institutionSchema).default([]),
  contactName: z.string().optional().default(""),
  contactEmail: z.string().email().optional().or(z.literal("")).default(""),
  dependencies: z.string().optional(),
  requirements: z.string().optional(),
  installation: z.string().optional(),
  execution: z.string().optional(),
  inputFiles: z.string().optional(),
  outputFiles: z.string().optional(),
  notes: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  license: z.string().optional(),
  relatedLinks: z.array(z.string()).optional(),
  files: z.array(uploadedFileSchema).default([])
});

// Strict schema enforced when a researcher SUBMITS for review.
export const submitProjectSchema = draftProjectSchema.extend({
  description: z.string().min(10, "Please describe the project"),
  purpose: z.string().min(5, "Please state the purpose"),
  authors: z.array(authorSchema).min(1, "At least one author is required"),
  institutions: z.array(institutionSchema).min(1, "At least one institution is required"),
  contactName: z.string().min(2, "Contact name required"),
  contactEmail: z.string().email("Valid contact email required")
});

export type DraftProjectInput = z.infer<typeof draftProjectSchema>;
export type SubmitProjectInput = z.infer<typeof submitProjectSchema>;
