import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { getProject, updateProject } from "@/lib/store";
import { generateProjectDocs } from "@/lib/docgen/generator";
import { PUBLISHED_ROOT, projectFolderName, slugify } from "@/lib/constants";
import { notify } from "@/lib/email";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

// Curator generates (or regenerates) the README + AI summary for a project.
// Uses the pluggable generator (Ollama if available, otherwise template).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let user;
  try { user = await requireRole(req, "curator"); }
  catch (e: any) { return fail(e.message, e.status || 403); }

  const p = await getProject(params.id);
  if (!p) return fail("Not found", 404);

  const slug = p.slug || slugify(p.title);
  const docs = await generateProjectDocs(p);
  const wasSubmitted = p.status === "submitted";

  const updated = await updateProject(params.id, {
    slug,
    repoPath: `${PUBLISHED_ROOT}/${projectFolderName(p.title)}`,
    status: wasSubmitted ? "under_review" : p.status,
    readme: docs.readme,
    summary: docs.summary,
    draft: { markdown: docs.readme, generatedBy: docs.generatedBy.startsWith("ollama") ? "anthropic" : "template", generatedAt: new Date().toISOString(), edited: false }
  }, { at: new Date().toISOString(), actor: user.email, action: "draft_generated", note: docs.generatedBy });

  if (wasSubmitted && p.contactEmail) {
    await notify({
      to: p.contactEmail,
      subject: `[EASER] "${p.title}" is under review`,
      text: `A curator has started reviewing your project "${p.title}".`
    });
  }
  return ok(updated);
}
