import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { getProject } from "@/lib/store";
import { publishProject, PublishError } from "@/lib/publish";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

// Curator approval — publishes the project (project-centric layout) to GitHub.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let user;
  try { user = await requireRole(req, "curator"); }
  catch (e: any) { return fail(e.message, e.status || 403); }

  const p = await getProject(params.id);
  if (!p) return fail("Not found", 404);
  if (!["submitted", "under_review", "approved", "published"].includes(p.status))
    return fail(`Cannot approve a project with status "${p.status}"`, 409);

  try {
    const updated = await publishProject(p, user.email);
    return ok(updated);
  } catch (e: any) {
    return fail(e.message || "Publish failed", e instanceof PublishError ? e.status : 502);
  }
}
