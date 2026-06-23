import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { TeamManager } from "@/components/admin/TeamManager";
export const metadata = { title: "Team Management" };

export default async function AdminTeamPage() {
  const user = await getServerUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-stone-900">Team Management</h1>
      <p className="mt-1 text-sm text-stone-500">Add, edit, order and feature team members shown on the public Team page.</p>
      <div className="mt-6"><TeamManager /></div>
    </div>
  );
}
