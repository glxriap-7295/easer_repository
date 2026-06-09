import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { getProject, updateProject } from "@/lib/store";
import { buildProjectReadme } from "@/lib/docgen/project";
import { CONTRIB_ROOT, slugify, contributionFileName } from "@/lib/constants";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

// Curator generates (or regenerates) the README draft for a submitted project.
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

  const updated = await updateProject(params.id, {
    slug,
    repoPath: `${CONTRIB_ROOT}/${slug}`,
    status: p.status === "submitted" ? "under_review" : p.status,
    draft: { markdown, generatedBy: "template", generatedAt: new Date().toISOString(), edited: false }
  }, { at: new Date().toISOString(), actor: user.email, action: "draft_generated" });

  return ok(updated);
}
