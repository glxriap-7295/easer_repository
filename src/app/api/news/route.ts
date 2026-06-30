import { listNews } from "@/lib/store";
import { ok } from "@/lib/api";
export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always read fresh data (no build-time caching)
export async function GET() { return ok(await listNews({ publishedOnly: true })); }
