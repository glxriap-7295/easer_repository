import "server-only";
import { getAdminDb } from "./firebase/admin";
import type { Contribution, RegistryRecord, AuditEntry } from "./types";

// Data-access layer for contributions, the public registry, and the audit log.
// Uses Firestore (Admin SDK) when configured; otherwise falls back to an
// in-memory store so the full workflow can be demonstrated with zero
// credentials. The in-memory store is process-local and resets on restart.

const mem = {
  contributions: new Map<string, Contribution>(),
  registry: new Map<string, RegistryRecord>()
};

const COL = "contributions";
const REG = "registry";
const AUDIT = "audit";

export const usingFirestore = () => getAdminDb() !== null;

export async function createContribution(c: Contribution): Promise<Contribution> {
  const db = getAdminDb();
  if (db) {
    await db.collection(COL).doc(c.id).set(c);
  } else {
    mem.contributions.set(c.id, c);
  }
  return c;
}

export async function getContribution(id: string): Promise<Contribution | null> {
  const db = getAdminDb();
  if (db) {
    const snap = await db.collection(COL).doc(id).get();
    return snap.exists ? (snap.data() as Contribution) : null;
  }
  return mem.contributions.get(id) ?? null;
}

export async function updateContribution(
  id: string,
  patch: Partial<Contribution>,
  audit?: AuditEntry
): Promise<Contribution | null> {
  const existing = await getContribution(id);
  if (!existing) return null;
  const next: Contribution = {
    ...existing,
    ...patch,
    audit: audit ? [...existing.audit, audit] : existing.audit,
    updatedAt: new Date().toISOString()
  };
  const db = getAdminDb();
  if (db) {
    await db.collection(COL).doc(id).set(next);
    if (audit) await db.collection(AUDIT).add({ contributionId: id, ...audit });
  } else {
    mem.contributions.set(id, next);
  }
  return next;
}

export async function listContributions(status?: string): Promise<Contribution[]> {
  const db = getAdminDb();
  if (db) {
    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection(COL);
    if (status) q = q.where("status", "==", status);
    const snap = await q.get();
    const rows = snap.docs.map((d) => d.data() as Contribution);
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  let rows = [...mem.contributions.values()];
  if (status) rows = rows.filter((r) => r.status === status);
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function upsertRegistry(rec: RegistryRecord): Promise<void> {
  const db = getAdminDb();
  if (db) await db.collection(REG).doc(rec.id).set(rec);
  else mem.registry.set(rec.id, rec);
}

export async function listRegistry(): Promise<RegistryRecord[]> {
  const db = getAdminDb();
  if (db) {
    const snap = await db.collection(REG).get();
    return snap.docs.map((d) => d.data() as RegistryRecord);
  }
  return [...mem.registry.values()];
}
