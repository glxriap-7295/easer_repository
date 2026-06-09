import "server-only";
import { getDocProvider } from "../llm";
import type { DocGenContext } from "../llm";
import type { DocumentationDraft } from "../types";

// Single entry point used by the API. Produces a documentation draft and the
// metadata about how it was generated. The result is always editable downstream.
export async function generateDocumentation(ctx: DocGenContext): Promise<DocumentationDraft> {
  const provider = getDocProvider();
  const { markdown, generatedBy } = await provider.generate(ctx);
  return {
    markdown,
    generatedBy,
    generatedAt: new Date().toISOString(),
    edited: false
  };
}
