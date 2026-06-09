import "server-only";

// Storage is intentionally decoupled from any single backend. To add S3, GCS,
// Backblaze, etc. later, implement this interface and register it in index.ts —
// no other part of the platform needs to change.
export interface PutResult {
  storageKey: string;
  url?: string;
  sha?: string;
  size: number;
  contentType: string;
}

export interface StorageProvider {
  readonly name: string;
  put(key: string, data: Buffer, contentType: string): Promise<PutResult>;
  get(key: string): Promise<Buffer>;
  getUrl(key: string): Promise<string | undefined>;
  delete(key: string): Promise<void>;
}
