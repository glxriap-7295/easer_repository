import { NextRequest } from "next/server";
import { resolveUser, hasRole } from "@/lib/auth";
import { getProject, updateProject } from "@/lib/store";
import { publishProject, PublishError } from "@/lib/publish";
import { uploadedFileSchema } from "@/lib/schemas";
import { z } from "zod";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

const bodySchema = z.object({ files: z.array(uploadedFileSchema).min(1, "Add at least one file") });

// Project evolution: the owner (or a curator) adds files to an already
// approved/published project. Documentation + summary are regenerated and a new
// version is published automatically — no duplicate project, minimal admin work.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await resolveUser(req);
  if (!user) return fail("Unauthorized", 401);

  const p = await getProject(params.id);
  if (!p) return fail("Not found", 404);
  if (p.ownerUid !== user.uid && !hasRole(user, "curator")) return fail("Forbidden", 403);
  if (!["approved", "published"].includes(p.status))
    return fail("Only approved/published projects accept added files here. Use submit for drafts.", 409);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Validation failed", 422, parsed.error.flatten());

  const merged = await updateProject(params.id,
    { files: [...p.files, ...parsed.data.files] },
    { at: new Date().toISOString(), actor: user.email, action: "files_added", note: `${parsed.data.files.length} file(s)` });
  if (!merged) return fail("Not found", 404);

  try {
    const updated = await publishProject(merged, user.email);
    return ok(updated);
  } catch (e: any) {
    return fail(e.message || "Publish failed", e instanceof PublishError ? e.status : 502);
  }
}
