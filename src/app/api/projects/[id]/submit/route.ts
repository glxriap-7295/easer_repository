import { NextRequest } from "next/server";
import { resolveUser } from "@/lib/auth";
import { getProject, updateProject } from "@/lib/store";
import { submitProjectSchema } from "@/lib/schemas";
import { notify } from "@/lib/email";
import { ok, fail } from "@/lib/api";
import { slugify } from "@/lib/constants";

export const runtime = "nodejs";

// Owner submits a draft for review (strict validation of the saved project).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await resolveUser(req);
  if (!user) return fail("Unauthorized", 401);
  const p = await getProject(params.id);
  if (!p) return fail("Not found", 404);
  if (p.ownerUid !== user.uid) return fail("Forbidden", 403);
  if (!["draft", "changes_requested"].includes(p.status)) return fail("Project is not editable", 409);

  const parsed = submitProjectSchema.safeParse(p);
  if (!parsed.success) return fail("Project is incomplete — please fill required fields", 422, parsed.error.flatten());

  const now = new Date().toISOString();
  const updated = await updateProject(params.id,
    { status: "submitted", submittedAt: now, slug: slugify(p.title) },
    { at: now, actor: user.email, action: "submitted" });

  await notify({
    to: process.env.ADMIN_EMAIL || "easer.data@gmail.com",
    subject: `[EASER] Project submitted: ${p.title}`,
    text: `${user.email} submitted "${p.title}" for review.`
  });
  await notify({
    to: p.contactEmail || user.email,
    subject: `[EASER] Submission received: ${p.title}`,
    text: `We received your submission "${p.title}". A curator will review it shortly.`
  });
  return ok(updated);
}
