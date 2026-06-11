// Client-safe role + profile definitions (no "server-only"; importable from
// both server modules and client components).
export type Role = "researcher" | "curator" | "admin";

export const ROLES: Role[] = ["researcher", "curator", "admin"];
export const ROLE_RANK: Record<Role, number> = { researcher: 1, curator: 2, admin: 3 };
export const ROLE_LABEL: Record<Role, string> = {
  researcher: "Researcher",
  curator: "Curator",
  admin: "Administrator"
};

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  institution?: string;
  orcid?: string;
  photoURL?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
