import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";

export const metadata = { title: "User Management" };

// Admin-only. Full user/role management UI is delivered in Phase 7; this page
// demonstrates the admin-only server guard and reserves the route.
export default async function UsersAdminPage() {
  const user = await getServerUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-stone-900">User Management</h1>
      <p className="mt-2 text-stone-600">
        Signed in as <strong>{user.email}</strong> (administrator). Full controls — view users,
        promote/demote roles, and deactivate accounts — arrive in a later update. The role system,
        custom claims, and admin bootstrap are already active.
      </p>
    </div>
  );
}
