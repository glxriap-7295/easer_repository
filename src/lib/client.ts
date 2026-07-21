"use client";
// Browser-side fetch helpers. Authenticated calls attach the current Firebase
// user's ID token as a Bearer credential.
import { auth } from "./firebase/client";

async function authHeaders(json = true): Promise<HeadersInit> {
  const headers: Record<string, string> = {};
  if (json) headers["content-type"] = "application/json";
  try {
    const user = auth.currentUser;
    if (user) headers["authorization"] = `Bearer ${await user.getIdToken()}`;
  } catch {
    /* firebase not configured */
  }
  return headers;
}

// Robustly turn a Response into our { ok, data, error } envelope. Never throws
// "Unexpected end of JSON input": empty or non-JSON bodies (e.g. a 413 "payload
// too large", a proxy timeout, or an HTML error page) become friendly messages.
async function readEnvelope<T>(res: Response): Promise<T> {
  const raw = await res.text().catch(() => "");
  if (!raw.trim()) {
    if (res.status === 413) throw new Error("The file is too large to upload. Please use a smaller file.");
    throw new Error(res.ok ? "The server returned an empty response." : `Request failed (${res.status} ${res.statusText || "error"}).`);
  }
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    // Non-JSON (often an HTML error page). Surface a short, friendly message.
    if (res.status === 413) throw new Error("The file is too large to upload. Please use a smaller file.");
    throw new Error(`Request failed (${res.status || "network"}). Please try again.`);
  }
  if (!json.ok) throw new Error(json.error || `Request failed (${res.status}).`);
  return json.data as T;
}

export async function apiGet<T = any>(url: string, auth = false): Promise<T> {
  const res = await fetch(url, { headers: auth ? await authHeaders(false) : undefined });
  return readEnvelope<T>(res);
}

export async function apiPost<T = any>(url: string, body?: unknown, auth = false): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: auth ? await authHeaders() : { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  return readEnvelope<T>(res);
}

export async function apiPatch<T = any>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "PATCH", headers: await authHeaders(), body: JSON.stringify(body) });
  return readEnvelope<T>(res);
}

export async function apiDelete<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE", headers: await authHeaders(false) });
  return readEnvelope<T>(res);
}

// Upload a single file via the multipart /api/upload endpoint. Uses the same
// robust envelope parsing so failed uploads never surface raw JSON errors.
export async function uploadFile(file: File): Promise<{ name: string; size: number; contentType: string; storageKey: string; sha?: string; url?: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  return readEnvelope(res);
}
