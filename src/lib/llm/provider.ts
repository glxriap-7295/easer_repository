import "server-only";
import type { ContributionMetadata, Submitter, UploadedFile } from "../types";

export interface DocGenContext {
  submitter: Submitter;
  metadata: ContributionMetadata;
  files: UploadedFile[];
  repoPath: string;
}

export interface DocResult {
  markdown: string;
  generatedBy: "template" | "anthropic";
}

export interface DocProvider {
  readonly name: "template" | "anthropic";
  generate(ctx: DocGenContext): Promise<DocResult>;
}
