import { NextRequest } from "next/server";
import { createContributionSchema } from "@/lib/schemas";
import { createContribution, listContributions } from "@/lib/store";
import { requireAdmin } from "@/lib/auth";
import { notify } from "@/lib/email";
import { ok, fail, newId } from "@/lib/api";
import type { Contribution } from "@/lib/types";

export const runtime = "nodejs";

// Public: a researcher submits a new contribution (submission + metadata).
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = createContributionSchema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422, parsed.error.flatten());

  const now = new Date().toISOString();
  const c: Contribution = {
    id: newId(),
    status: "metadata_complete",
    submitter: parsed.data.submitter,
    metadata: parsed.data.metadata,
    files: parsed.data.files,
    audit: [{ at: now, actor: parsed.data.submitter.email, action: "submitted" }],
    createdAt: now,
    updatedAt: now
  };
  await createContribution(c);

  await notify({
    to: process.env.ADMIN_EMAIL || "easer.data@gmail.com",
    subject: `[EASER] New contribution: ${c.metadata.title}`,
    text: `${c.submitter.name} (${c.submitter.affiliation}) submitted "${c.metadata.title}".\nReview it in the admin dashboard.`
  });

  return ok({ id: c.id, status: c.status }, { status: 201 });
}

// Admin: list contributions (optionally filtered by ?status=).
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e: any) {
    return fail(e.message || "Forbidden", e.status || 403);
  }
  const status = req.nextUrl.searchParams.get("status") || undefined;
  const rows = await listContributions(status || undefined);
  return ok(rows);
}
