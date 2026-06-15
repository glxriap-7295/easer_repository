import "server-only";
import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
  type App
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Lazily initialise the Admin SDK. Supports either a JSON string in
// FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS (file path).
let app: App | null = null;

export function getAdminApp(): App | null {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0]!;
    return app;
  }
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (raw) {
      const creds = JSON.parse(raw);
      app = initializeApp({ credential: cert(creds), projectId: creds.project_id });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      app = initializeApp({ credential: applicationDefault() });
    } else {
      console.warn("[firebase/admin] No credentials configured — running in degraded (in-memory) mode.");
      return null;
    }
  } catch (err) {
    console.error("[firebase/admin] init failed:", err);
    return null;
  }
  return app;
}

let settingsApplied = false;
export function getAdminDb(): Firestore | null {
  const a = getAdminApp();
  if (!a) return null;
  const db = getFirestore(a);
  if (!settingsApplied) {
    // Belt-and-suspenders: never let an undefined value reach Firestore.
    try { db.settings({ ignoreUndefinedProperties: true }); } catch { /* already initialised */ }
    settingsApplied = true;
  }
  return db;
}

export const isAdminConfigured = () => getAdminApp() !== null;
