"use client";
// Browser-side fetch helpers. Admin calls attach the Firebase ID token when
// available, and a dev-admin header in development for credential-free demos.
import { auth } from "./firebase/client";

async function authHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  try {
    const user = auth.currentUser;
    if (user) headers["authorization"] = `Bearer ${await user.getIdToken()}`;
  } catch {
    /* firebase not configured */
  }
  if (process.env.NODE_ENV !== "production") headers["x-easer-dev-admin"] = "true";
  return headers;
}

export async function apiGet<T = any>(url: string, admin = false): Promise<T> {
  const res = await fetch(url, { headers: admin ? await authHeaders() : undefined });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Request failed");
  return json.data;
}

export async function apiPost<T = any>(url: string, body?: unknown, admin = false): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: admin ? await authHeaders() : { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Request failed");
  return json.data;
}

export async function apiPatch<T = any>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "PATCH", headers: await authHeaders(), body: JSON.stringify(body) });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Request failed");
  return json.data;
}
