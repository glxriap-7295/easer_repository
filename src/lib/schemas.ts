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
  sha: z.string().optional()
});

export const createContributionSchema = z.object({
  submitter: submitterSchema,
  metadata: metadataSchema,
  files: z.array(uploadedFileSchema).default([])
});

export type CreateContributionInput = z.infer<typeof createContributionSchema>;
