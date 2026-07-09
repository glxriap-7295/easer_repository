import { NextRequest } from "next/server";
import { requireRole, hasRole } from "@/lib/auth";
import { draftProjectSchema, submitProjectSchema } from "@/lib/schemas";
import { createProject, listProjects, listProjectsByOwner } from "@/lib/store";
import { notify } from "@/lib/email";
import { ok, fail, newId } from "@/lib/api";
import { slugify } from "@/lib/constants";
import type { Project } from "@/lib/types";

export const runtime = "nodejs";

// Create a project — either saved as a draft or submitted for review.
export async function POST(req: NextRequest) {
  let user;
  try { user = await requireRole(req, "researcher"); }
  catch (e: any) { return fail(e.message, e.status || 401); }

  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid JSON");
  const asDraft = body.draft === true || body.status === "draft";

  const schema = asDraft ? draftProjectSchema : submitProjectSchema;
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Validation failed", 422, parsed.error.flatten());
  const d = parsed.data as any;

  const now = new Date().toISOString();
  const project: Project = {
    id: newId("p"),
    status: asDraft ? "draft" : "submitted",
    ownerUid: user.uid,
    title: d.title,
    projectType: d.projectType || "research",
    category: d.category,
    description: d.description || "",
    purpose: d.purpose || "",
    authors: d.authors || [],
    institutions: d.institutions || [],
    contactName: d.contactName || "",
    contactEmail: d.contactEmail || user.email,
    dependencies: d.dependencies, requirements: d.requirements,
    installation: d.installation, execution: d.execution,
    inputFiles: d.inputFiles, outputFiles: d.outputFiles, notes: d.notes,
    keywords: d.keywords || [], license: d.license, relatedLinks: d.relatedLinks,
    files: d.files || [],
    slug: slugify(d.title),
    audit: [{ at: now, actor: user.email, action: asDraft ? "draft_created" : "submitted" }],
    createdAt: now,
    updatedAt: now,
    submittedAt: asDraft ? undefined : now
  };
  await createProject(project);

  if (!asDraft) {
    await notify({
      to: process.env.ADMIN_EMAIL || "easer.data@gmail.com",
      subject: `[EASER] New project submitted: ${project.title}`,
      text: `${user.email} submitted "${project.title}" for review.`
    });
    await notify({
      to: project.contactEmail,
      subject: `[EASER] Submission received: ${project.title}`,
      text: `We received your submission "${project.title}". A curator will review it shortly.`
    });
  }
  return ok({ id: project.id, status: project.status }, { status: 201 });
}

// List projects. Researchers see their own; curators+ can request the review queue.
export async function GET(req: NextRequest) {
  let user;
  try { user = await requireRole(req, "researcher"); }
  catch (e: any) { return fail(e.message, e.status || 401); }

  const scope = req.nextUrl.searchParams.get("scope");
  const status = req.nextUrl.searchParams.get("status") || undefined;
  if (scope === "review" && hasRole(user, "curator")) {
    return ok(await listProjects(status || undefined));
  }
  return ok(await listProjectsByOwner(user.uid));
}
