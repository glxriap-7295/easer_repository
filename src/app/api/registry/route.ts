import { listRegistry } from "@/lib/store";
import { ok } from "@/lib/api";

export const runtime = "nodejs";

// Public list of approved/published contributions (the documentation index).
export async function GET() {
  const registry = await listRegistry();
  registry.sort((a, b) => b.approvedAt.localeCompare(a.approvedAt));
  return ok(registry);
}
