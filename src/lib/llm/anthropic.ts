import "server-only";
import type { DocProvider, DocGenContext, DocResult } from "./provider";
import { TemplateDocProvider } from "./template";

// Anthropic-backed generator. Produces polished prose from the same metadata.
// Falls back to the template generator if no API key is set or the call fails,
// so documentation generation never hard-fails the workflow.
export class AnthropicDocProvider implements DocProvider {
  readonly name = "anthropic" as const;
  private fallback = new TemplateDocProvider();

  async generate(ctx: DocGenContext): Promise<DocResult> {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return this.fallback.generate(ctx);

    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
    const prompt = buildPrompt(ctx);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }]
        })
      });
      if (!res.ok) throw new Error(`Anthropic API ${res.status}`);
      const data = await res.json();
      const text: string = data?.content?.[0]?.text ?? "";
      if (!text.trim()) throw new Error("Empty completion");
      return { markdown: text.trim(), generatedBy: "anthropic" };
    } catch (err) {
      console.error("[llm/anthropic] falling back to template:", err);
      return this.fallback.generate(ctx);
    }
  }
}

function buildPrompt(ctx: DocGenContext): string {
  const { submitter, metadata: m, files, repoPath } = ctx;
  return `You are documenting a research contribution for the EASER repository (a multi-institutional initiative with Universidad de Chile, SENAPRED and ANID).
Write a clear, professional README.md in Markdown using EXACTLY these sections as level-2 headings in this order: Author, Affiliation, Description, Purpose, Dependencies, Requirements, Installation, Execution, Input Files, Output Files, Keywords, Notes, Contact. Start with a level-1 title.
Be faithful to the provided information; do not invent technical details. If a field is empty, write "Not specified." Keep an academic, concise tone.

Repository path: ${repoPath}
Title: ${m.title}
Category: ${m.category}
Author: ${submitter.name}
Affiliation: ${submitter.affiliation}
ORCID: ${submitter.orcid || "n/a"}
Email: ${submitter.email}
Description: ${m.description}
Purpose: ${m.purpose}
Dependencies: ${m.dependencies || ""}
Requirements: ${m.requirements || ""}
Installation: ${m.installation || ""}
Execution: ${m.execution || ""}
Input files: ${m.inputFiles || ""}
Output files: ${m.outputFiles || ""}
Keywords: ${(m.keywords || []).join(", ")}
License: ${m.license || ""}
Notes: ${m.notes || ""}
Attached files: ${files.map((f) => f.name).join(", ") || "none"}

Output only the Markdown document, no preamble.`;
}
