import { NextRequest } from "next/server";
import { resolveUser, hasRole } from "@/lib/auth";
import { getProject, updateProject } from "@/lib/store";
import { draftProjectSchema } from "@/lib/schemas";
import { ok, fail } from "@/lib/api";
import { slugify } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await resolveUser(req);
  if (!user) return fail("Unauthorized", 401);
  const p = await getProject(params.id);
  if (!p) return fail("Not found", 404);
  if (p.ownerUid !== user.uid && !hasRole(user, "curator")) return fail("Forbidden", 403);
  return ok(p);
}

// Owner edits an editable draft; curators edit the generated README / status.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await resolveUser(req);
  if (!user) return fail("Unauthorized", 401);
  const p = await getProject(params.id);
  if (!p) return fail("Not found", 404);

  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid JSON");

  const isOwner = p.ownerUid === user.uid;
  const isCurator = hasRole(user, "curator");
  if (!isOwner && !isCurator) return fail("Forbidden", 403);

  const patch: any = {};

  if (isOwner && (p.status === "draft" || p.status === "changes_requested")) {
    const parsed = draftProjectSchema.partial().safeParse(body);
    if (!parsed.success) return fail("Validation failed", 422, parsed.error.flatten());
    Object.assign(patch, parsed.data);
    if (parsed.data.title) patch.slug = slugify(parsed.data.title);
  }

  if (isCurator) {
    if (typeof body.draftMarkdown === "string") {
      patch.draft = {
        markdown: body.draftMarkdown,
        generatedBy: p.draft?.generatedBy || "template",
        generatedAt: p.draft?.generatedAt || new Date().toISOString(),
        edited: true
      };
    }
    if (typeof body.status === "string") patch.status = body.status;
  }

  const updated = await updateProject(params.id, patch, {
    at: new Date().toISOString(), actor: user.email, action: "edited"
  });
  return ok(updated);
}
