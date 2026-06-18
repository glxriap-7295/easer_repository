import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { getProject, updateProject } from "@/lib/store";
import { notify } from "@/lib/email";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

// Curator rejects or requests changes (requestChanges=true keeps it editable).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let user;
  try { user = await requireRole(req, "admin"); }
  catch (e: any) { return fail(e.message, e.status || 403); }

  const body = await req.json().catch(() => ({}));
  const p = await getProject(params.id);
  if (!p) return fail("Not found", 404);

  const status = body?.requestChanges ? "changes_requested" : "rejected";
  const updated = await updateProject(params.id,
    { status, reviewNote: body?.note || "" },
    { at: new Date().toISOString(), actor: user.email, action: status, note: body?.note });

  await notify({
    to: p.contactEmail,
    subject: `[EASER] Update on "${p.title}"`,
    text: status === "changes_requested"
      ? `A curator requested changes to "${p.title}":\n\n${body?.note || "(no note)"}\n\nEdit and resubmit from your dashboard.`
      : `Your submission "${p.title}" was not accepted.\n\nReviewer note: ${body?.note || "(none)"}`
  });
  return ok(updated);
}
