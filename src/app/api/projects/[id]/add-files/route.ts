import { NextRequest } from "next/server";
import { resolveUser, hasRole } from "@/lib/auth";
import { getProject, updateProject } from "@/lib/store";
import { uploadedFileSchema } from "@/lib/schemas";
import { notify } from "@/lib/email";
import { z } from "zod";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

const bodySchema = z.object({ files: z.array(uploadedFileSchema).min(1, "Add at least one file") });

// Project evolution: the owner (or an admin) adds files to an existing project.
// Files are appended and the project is re-submitted for ADMIN approval — the
// only path that writes to GitHub. On approval the README/AI_SUMMARY regenerate
// automatically and a new version is published. No duplicate project is created.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await resolveUser(req);
  if (!user) return fail("Unauthorized", 401);

  const p = await getProject(params.id);
  if (!p) return fail("Not found", 404);
  if (p.ownerUid !== user.uid && !hasRole(user, "admin")) return fail("Forbidden", 403);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Validation failed", 422, parsed.error.flatten());

  const now = new Date().toISOString();
  const updated = await updateProject(params.id,
    { files: [...p.files, ...parsed.data.files], status: "submitted", submittedAt: now },
    { at: now, actor: user.email, action: "files_added", note: `${parsed.data.files.length} file(s) — resubmitted for approval` });
  if (!updated) return fail("Not found", 404);

  await notify({
    to: process.env.ADMIN_EMAIL || "easer.data@gmail.com",
    subject: `[EASER] Updated project awaiting approval: ${p.title}`,
    text: `${user.email} added ${parsed.data.files.length} file(s) to "${p.title}". Approve to publish a new version (documentation regenerates automatically).`
  });
  return ok(updated);
}
