import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { getProject, updateProject } from "@/lib/store";
import { buildProjectReadme } from "@/lib/docgen/project";
import { CONTRIB_ROOT, slugify, contributionFileName } from "@/lib/constants";
import { notify } from "@/lib/email";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

// Curator generates (or regenerates) the README draft for a submitted project.
// The first generation moves the project to "under_review" and notifies the
// contributor.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let user;
  try { user = await requireRole(req, "curator"); }
  catch (e: any) { return fail(e.message, e.status || 403); }

  const p = await getProject(params.id);
  if (!p) return fail("Not found", 404);

  const slug = p.slug || slugify(p.title);
  const primaryAuthor = p.authors[0]?.name || p.contactName || "anon";
  const publishedNames = p.files.map((f) => contributionFileName(slug, primaryAuthor, f.name));
  const markdown = buildProjectReadme({ ...p, slug }, publishedNames);

  const wasSubmitted = p.status === "submitted";
  const updated = await updateProject(params.id, {
    slug,
    repoPath: `${CONTRIB_ROOT}/${slug}`,
    status: wasSubmitted ? "under_review" : p.status,
    draft: { markdown, generatedBy: "template", generatedAt: new Date().toISOString(), edited: false }
  }, { at: new Date().toISOString(), actor: user.email, action: "draft_generated" });

  if (wasSubmitted && p.contactEmail) {
    await notify({
      to: p.contactEmail,
      subject: `[EASER] "${p.title}" is under review`,
      text: `Good news — a curator has started reviewing your project "${p.title}". You'll be notified of the outcome.`
    });
  }
  return ok(updated);
}
