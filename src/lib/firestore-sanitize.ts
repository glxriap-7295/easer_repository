// Firestore rejects `undefined` values. This recursively removes any property
// whose value is `undefined` (omitting it entirely), descending into nested
// objects and arrays, while preserving null, Date, and primitives. Applied at
// every Firestore write so no document can ever contain `undefined` — globally,
// not field-by-field.
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((v) => v !== undefined)
      .map((v) => stripUndefined(v)) as unknown as T;
  }
  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}
