import { NextRequest } from "next/server";
import { getStorageProvider } from "@/lib/storage";
import { ok, fail, newId } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 60;

// Accept a file upload and store it via the configured StorageProvider.
// Returns an UploadedFile reference the client attaches to its submission.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return fail("Expected multipart/form-data");
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Missing 'file'");

  const buf = Buffer.from(await file.arrayBuffer());
  const key = `uploads/${newId("f")}/${file.name}`;
  try {
    const storage = getStorageProvider();
    const res = await storage.put(key, buf, file.type || "application/octet-stream");
    const url = await storage.getUrl(key);
    return ok({
      name: file.name,
      size: res.size,
      contentType: res.contentType,
      storageKey: res.storageKey,
      sha: res.sha,
      url
    });
  } catch (e: any) {
    return fail(`Upload failed: ${e.message || e}`, 502);
  }
}
