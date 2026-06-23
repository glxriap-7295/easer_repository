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

export async function apiGet<T = any>(url: string, auth = false): Promise<T> {
  const res = await fetch(url, { headers: auth ? await authHeaders(false) : undefined });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Request failed");
  return json.data;
}

export async function apiPost<T = any>(url: string, body?: unknown, auth = false): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: auth ? await authHeaders() : { "content-type": "application/json" },
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

export async function apiDelete<T = any>(url: string): Promise<T> {
  const res = await fetch(url, { method: "DELETE", headers: await authHeaders(false) });
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Request failed");
  return json.data;
}
