import { NextRequest } from "next/server";
import { getContribution, updateContribution } from "@/lib/store";
import { requireAdmin } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
  } catch (e: any) {
    return fail(e.message, e.status || 403);
  }
  const c = await getContribution(params.id);
  if (!c) return fail("Not found", 404);
  return ok(c);
}

// Edit the draft markdown or metadata before approval.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  let user;
  try {
    user = await requireAdmin(req);
  } catch (e: any) {
    return fail(e.message, e.status || 403);
  }
  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid JSON");

  const c = await getContribution(params.id);
  if (!c) return fail("Not found", 404);

  const patch: any = {};
  if (typeof body.draftMarkdown === "string") {
    patch.draft = {
      markdown: body.draftMarkdown,
      generatedBy: c.draft?.generatedBy || "template",
      generatedAt: c.draft?.generatedAt || new Date().toISOString(),
      edited: true
    };
  }
  if (body.metadata) patch.metadata = { ...c.metadata, ...body.metadata };
  if (body.status) patch.status = body.status;

  const updated = await updateContribution(params.id, patch, {
    at: new Date().toISOString(),
    actor: user.email,
    action: "edited"
  });
  return ok(updated);
}
