import "server-only";
import type { DocProvider } from "./provider";
import { TemplateDocProvider } from "./template";
import { AnthropicDocProvider } from "./anthropic";

export function getDocProvider(): DocProvider {
  const p = (process.env.LLM_PROVIDER || "template").toLowerCase();
  return p === "anthropic" ? new AnthropicDocProvider() : new TemplateDocProvider();
}

export type { DocGenContext, DocResult, DocProvider } from "./provider";
