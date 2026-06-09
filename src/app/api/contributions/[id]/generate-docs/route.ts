import { NextRequest } from "next/server";
import { getContribution, updateContribution } from "@/lib/store";
import { requireAdmin } from "@/lib/auth";
import { generateDocumentation } from "@/lib/docgen/generate";
import { categoryRepoDir } from "@/lib/constants";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

// Generate (or regenerate) the documentation draft for a contribution.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireAdmin(req);
  } catch (e: any) {
    return fail(e.message, e.status || 403);
  }
  const c = await getContribution(params.id);
  if (!c) return fail("Not found", 404);

  const slug = c.metadata.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
  const repoPath = `${process.env.GITHUB_CONTRIB_DIR || "contributions"}/${categoryRepoDir(c.metadata.category)}/${slug}`;

  const draft = await generateDocumentation({
    submitter: c.submitter,
    metadata: c.metadata,
    files: c.files,
    repoPath
  });

  const updated = await updateContribution(
    params.id,
    { draft, repoPath, status: "in_review" },
    { at: new Date().toISOString(), actor: user.email, action: "draft_generated", note: draft.generatedBy }
  );
  return ok(updated);
}
