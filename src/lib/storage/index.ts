import "server-only";
import type { StorageProvider } from "./provider";
import { LocalStorageProvider } from "./local-storage";
import { FirebaseStorageProvider } from "./firebase-storage";

let cached: StorageProvider | null = null;

// Factory: choose the provider from env. Add new cases here as backends grow.
export function getStorageProvider(): StorageProvider {
  if (cached) return cached;
  const provider = (process.env.STORAGE_PROVIDER || "local").toLowerCase();
  switch (provider) {
    case "firebase":
      cached = new FirebaseStorageProvider();
      break;
    case "local":
    default:
      cached = new LocalStorageProvider();
      break;
  }
  return cached;
}

export type { StorageProvider, PutResult } from "./provider";
