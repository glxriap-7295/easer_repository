import "server-only";
import crypto from "crypto";
import { getStorage } from "firebase-admin/storage";
import { getAdminApp } from "../firebase/admin";
import type { StorageProvider, PutResult } from "./provider";

// Firebase Storage (GCS bucket) provider. The default for the EASER project.
export class FirebaseStorageProvider implements StorageProvider {
  readonly name = "firebase";
  private bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "easer-521eb.appspot.com";

  private bucket() {
    const app = getAdminApp();
    if (!app) throw new Error("Firebase Admin not configured");
    return getStorage(app).bucket(this.bucketName);
  }

  async put(key: string, data: Buffer, contentType: string): Promise<PutResult> {
    const file = this.bucket().file(key);
    await file.save(data, { contentType, resumable: false });
    const sha = crypto.createHash("sha256").update(data).digest("hex");
    return { storageKey: key, size: data.length, contentType, sha };
  }
  async get(key: string): Promise<Buffer> {
    const [buf] = await this.bucket().file(key).download();
    return buf;
  }
  async getUrl(key: string): Promise<string | undefined> {
    const [url] = await this.bucket().file(key).getSignedUrl({
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000
    });
    return url;
  }
  async delete(key: string): Promise<void> {
    await this.bucket().file(key).delete({ ignoreNotFound: true });
  }
}
