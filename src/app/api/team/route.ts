import { listTeam } from "@/lib/store";
import { ok } from "@/lib/api";
export const runtime = "nodejs";
export async function GET() { return ok(await listTeam()); }
