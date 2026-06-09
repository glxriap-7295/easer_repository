"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, LinkButton } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROLE_LABEL } from "@/lib/roles";

// Placeholder dashboard — the full researcher dashboard (My Projects by status)
// is built in Phase 4. This guards the route and gives signed-in users a home.
export default function DashboardPage() {
  const { user, profile, role, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !user) router.replace("/login?next=/dashboard"); }, [loading, user, router]);
  if (loading || !user) return <div className="mx-auto max-w-4xl px-4 py-16 text-stone-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-stone-900">Welcome, {profile?.displayName || user.email}</h1>
      <p className="mt-1 text-sm text-stone-500">{role && ROLE_LABEL[role]}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold text-stone-900">Contribute</h2>
          <p className="mt-1 text-sm text-stone-600">Submit a new research artifact to the EASER repository.</p>
          <div className="mt-4"><LinkButton href="/contribute">New contribution</LinkButton></div>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold text-stone-900">Profile</h2>
          <p className="mt-1 text-sm text-stone-600">Update your name, institution, ORCID, avatar, or password.</p>
          <div className="mt-4"><Link href="/profile" className="text-accent-600 hover:underline">Edit profile →</Link></div>
        </Card>
        {role && role !== "researcher" && (
          <Card className="p-6">
            <h2 className="font-semibold text-stone-900">Review queue</h2>
            <p className="mt-1 text-sm text-stone-600">Review and approve submitted contributions.</p>
            <div className="mt-4"><Link href="/admin" className="text-accent-600 hover:underline">Open review queue →</Link></div>
          </Card>
        )}
      </div>

      <p className="mt-8 text-sm text-stone-400">Your projects and submission history will appear here in an upcoming update.</p>
    </div>
  );
}
