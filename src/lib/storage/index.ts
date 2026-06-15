import "server-only";
import type { StorageProvider } from "./provider";
import { LocalStorageProvider } from "./local-storage";
import { FirebaseStorageProvider } from "./firebase-storage";
import { GitHubStorageProvider } from "./github-storage";

let cached: StorageProvider | null = null;
let cachedFor: string | null = null;

// Factory: choose the provider from env. Add new cases here as backends grow.
export function getStorageProvider(): StorageProvider {
  const provider = (process.env.STORAGE_PROVIDER || "local").toLowerCase();
  if (cached && cachedFor === provider) return cached;
  switch (provider) {
    case "firebase":
      cached = new FirebaseStorageProvider();
      break;
    case "github":
      cached = new GitHubStorageProvider();
      break;
    case "local":
    default:
      cached = new LocalStorageProvider();
      break;
  }
  cachedFor = provider;
  return cached;
}

export type { StorageProvider, PutResult } from "./provider";
