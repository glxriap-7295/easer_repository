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

/* ───────────────────────── Projects (Phase 3) ─────────────────────────
   Additive collection. Legacy `contributions` above is untouched. */

import type { Project } from "./types";

const PROJECTS = "projects";
const memProjects = new Map<string, Project>();

export async function createProject(p: Project): Promise<Project> {
  const db = getAdminDb();
  if (db) await db.collection(PROJECTS).doc(p.id).set(p);
  else memProjects.set(p.id, p);
  return p;
}

export async function getProject(id: string): Promise<Project | null> {
  const db = getAdminDb();
  if (db) {
    const snap = await db.collection(PROJECTS).doc(id).get();
    return snap.exists ? (snap.data() as Project) : null;
  }
  return memProjects.get(id) ?? null;
}

export async function updateProject(
  id: string,
  patch: Partial<Project>,
  audit?: AuditEntry
): Promise<Project | null> {
  const existing = await getProject(id);
  if (!existing) return null;
  const next: Project = {
    ...existing,
    ...patch,
    audit: audit ? [...existing.audit, audit] : existing.audit,
    updatedAt: new Date().toISOString()
  };
  const db = getAdminDb();
  if (db) {
    await db.collection(PROJECTS).doc(id).set(next);
    if (audit) await db.collection(AUDIT).add({ projectId: id, ...audit });
  } else {
    memProjects.set(id, next);
  }
  return next;
}

export async function listProjectsByOwner(ownerUid: string): Promise<Project[]> {
  const db = getAdminDb();
  let rows: Project[];
  if (db) {
    const snap = await db.collection(PROJECTS).where("ownerUid", "==", ownerUid).get();
    rows = snap.docs.map((d) => d.data() as Project);
  } else {
    rows = [...memProjects.values()].filter((p) => p.ownerUid === ownerUid);
  }
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listProjects(status?: string): Promise<Project[]> {
  const db = getAdminDb();
  let rows: Project[];
  if (db) {
    let q: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection(PROJECTS);
    if (status) q = q.where("status", "==", status);
    const snap = await q.get();
    rows = snap.docs.map((d) => d.data() as Project);
  } else {
    rows = [...memProjects.values()];
    if (status) rows = rows.filter((p) => p.status === status);
  }
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
