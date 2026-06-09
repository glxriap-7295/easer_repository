import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { StorageProvider, PutResult } from "./provider";

// Filesystem-backed provider. Useful for local development and the demo; not
// suitable for serverless production (ephemeral FS) but kept behind the same
// interface so swapping is trivial.
const ROOT = process.env.LOCAL_STORAGE_DIR || path.join(process.cwd(), ".storage");

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local";
  async put(key: string, data: Buffer, contentType: string): Promise<PutResult> {
    const full = path.join(ROOT, key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    const sha = crypto.createHash("sha256").update(data).digest("hex");
    return { storageKey: key, size: data.length, contentType, sha };
  }
  async get(key: string): Promise<Buffer> {
    return fs.readFile(path.join(ROOT, key));
  }
  async getUrl(): Promise<string | undefined> {
    return undefined; // local files are not web-addressable
  }
  async delete(key: string): Promise<void> {
    await fs.rm(path.join(ROOT, key), { force: true });
  }
}
