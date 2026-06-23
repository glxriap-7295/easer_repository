import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/auth";
import { NewsManager } from "@/components/admin/NewsManager";
export const metadata = { title: "News Management" };

export default async function AdminNewsPage() {
  const user = await getServerUser();
  if (!user || user.role !== "admin") redirect("/dashboard");
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-stone-900">News Management</h1>
      <p className="mt-1 text-sm text-stone-500">Create posts and articles, upload covers, save drafts, and publish to the public News page.</p>
      <div className="mt-6"><NewsManager /></div>
    </div>
  );
}
