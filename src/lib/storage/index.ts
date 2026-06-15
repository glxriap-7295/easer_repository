import "server-only";
import type { StorageProvider } from "./provider";
import { LocalStorageProvider } from "./local-storage";
import { FirebaseStorageProvider } from "./firebase-storage";
import { GitHubStorageProvider } from "./github-storage";
import { FirestoreStorageProvider } from "./firestore-storage";

let cached: StorageProvider | null = null;
let cachedFor: string | null = null;

// Factory: choose the provider from env. DEFAULT is "firestore" so draft uploads
// are held in temporary storage and NEVER committed to GitHub before approval.
// (The legacy "github" provider staged files in the repo — no longer the default.)
export function getStorageProvider(): StorageProvider {
  const provider = (process.env.STORAGE_PROVIDER || "firestore").toLowerCase();
  if (cached && cachedFor === provider) return cached;
  switch (provider) {
    case "firebase":
      cached = new FirebaseStorageProvider();
      break;
    case "github":
      cached = new GitHubStorageProvider();
      break;
    case "local":
      cached = new LocalStorageProvider();
      break;
    case "firestore":
    default:
      cached = new FirestoreStorageProvider();
      break;
  }
  cachedFor = provider;
  return cached;
}

export type { StorageProvider, PutResult } from "./provider";
