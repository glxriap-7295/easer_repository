import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { listUsers } from "@/lib/users";
import { ok, fail } from "@/lib/api";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try { await requireRole(req, "admin"); }
  catch (e: any) { return fail(e.message, e.status || 403); }
  return ok(await listUsers());
}
