import { NextRequest } from "next/server";
import { getContribution, updateContribution } from "@/lib/store";
import { requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/email";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireAdmin(req);
  } catch (e: any) {
    return fail(e.message, e.status || 403);
  }
  const body = await req.json().catch(() => ({}));
  const c = await getContribution(params.id);
  if (!c) return fail("Not found", 404);

  const updated = await updateContribution(
    params.id,
    { status: "rejected", reviewNote: body?.note || "" },
    { at: new Date().toISOString(), actor: user.email, action: "rejected", note: body?.note }
  );

  await notify({
    to: c.submitter.email,
    subject: `[EASER] Update on your contribution "${c.metadata.title}"`,
    text: `Your contribution needs changes before it can be published.\n\nReviewer note: ${body?.note || "(none provided)"}\n\nPlease resubmit through the EASER Research Data Hub.`
  });

  return ok(updated);
}
