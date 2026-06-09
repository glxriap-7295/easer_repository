import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { UsersManager } from "@/components/admin/UsersManager";

export const metadata = { title: "User Management" };

// Admin-only (server guard). Renders the client management table.
export default async function UsersAdminPage() {
  const user = await getServerUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-stone-900">User Management</h1>
      <p className="mt-1 text-sm text-stone-500">Promote or demote roles and activate/deactivate accounts.</p>
      <div className="mt-6"><UsersManager selfUid={user.uid} /></div>
    </div>
  );
}
