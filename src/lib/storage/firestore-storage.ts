import "server-only";
import crypto from "crypto";
import { getAdminDb } from "../firebase/admin";
import type { StorageProvider, PutResult } from "./provider";

// Firestore-backed TEMPORARY storage for draft/submitted uploads.
// Bytes are chunked (base64) across documents to respect Firestore's ~1 MiB
// per-document limit. NOTHING is written to GitHub here — files only reach the
// repository when a project is approved and `publishProject` commits them.
// Staged files are deleted automatically after a successful publish.
const COL = "_uploads";
const RAW_CHUNK = 600 * 1024; // ~600 KB raw -> ~800 KB base64 (< 1 MiB doc)
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 25) * 1024 * 1024;

function docId(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 1400);
}

export class FirestoreStorageProvider implements StorageProvider {
  readonly name = "firestore";

  private db() {
    const db = getAdminDb();
    if (!db) throw new Error("Firestore Admin not configured (cannot store uploads)");
    return db;
  }

  async put(key: string, data: Buffer, contentType: string): Promise<PutResult> {
    if (data.length > MAX_UPLOAD_BYTES) {
      throw new Error(`File exceeds the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB upload limit`);
    }
    const db = this.db();
    const id = docId(key);
    const ref = db.collection(COL).doc(id);
    const chunksRef = ref.collection("chunks");

    // Clear any prior chunks for this id (idempotent overwrite).
    const prev = await chunksRef.get();
    await Promise.all(prev.docs.map((d) => d.ref.delete()));

    let index = 0;
    for (let offset = 0; offset < data.length; offset += RAW_CHUNK) {
      const slice = data.subarray(offset, offset + RAW_CHUNK);
      await chunksRef.doc(String(index).padStart(5, "0")).set({ b64: slice.toString("base64") });
      index++;
    }
    const sha = crypto.createHash("sha256").update(data).digest("hex");
    await ref.set({ key, contentType, size: data.length, chunks: index, sha, createdAt: new Date().toISOString() });
    return { storageKey: key, size: data.length, contentType, sha };
  }

  async get(key: string): Promise<Buffer> {
    const db = this.db();
    const ref = db.collection(COL).doc(docId(key));
    const meta = await ref.get();
    if (!meta.exists) throw new Error(`Upload not found: ${key}`);
    const chunks = await ref.collection("chunks").orderBy("__name__").get();
    return Buffer.concat(chunks.docs.map((d) => Buffer.from((d.data() as any).b64 || "", "base64")));
  }

  async getUrl(): Promise<string | undefined> {
    // Staged files are not web-addressable; they surface only after publication.
    return undefined;
  }

  async delete(key: string): Promise<void> {
    const db = this.db();
    const ref = db.collection(COL).doc(docId(key));
    const chunks = await ref.collection("chunks").get();
    await Promise.all(chunks.docs.map((d) => d.ref.delete()));
    await ref.delete().catch(() => {});
  }
}
