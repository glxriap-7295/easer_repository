"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Badge, LinkButton, Button } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiGet } from "@/lib/client";
import { PROJECT_STATUS_LABEL, type ProjectStatus } from "@/lib/constants";
import type { Project } from "@/lib/types";

const TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "changes_requested", label: "Needs Changes" },
  { key: "approved", label: "Approved" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" }
];

const statusColor: Record<string, "slate" | "amber" | "green" | "red" | "blue"> = {
  draft: "slate", submitted: "amber", under_review: "amber", changes_requested: "red",
  approved: "green", published: "green", rejected: "red"
};

function DashboardInner() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingP, setLoadingP] = useState(true);
  const [tab, setTab] = useState("");
  const submitted = params.get("submitted");

  useEffect(() => { if (!loading && !user) router.replace("/login?next=/dashboard"); }, [loading, user, router]);
  useEffect(() => {
    if (!user) return;
    apiGet<Project[]>("/api/projects", true).then(setProjects).catch(() => setProjects([])).finally(() => setLoadingP(false));
  }, [user]);

  if (loading || !user) return <div className="mx-auto max-w-5xl px-4 py-16 text-stone-500">Loading…</div>;

  const counts: Record<string, number> = {};
  projects.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
  const shown = tab ? projects.filter((p) => p.status === tab) : projects;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">My projects</h1>
          <p className="mt-1 text-sm text-stone-500">{profile?.displayName} · {profile?.institution || "EASER researcher"}</p>
        </div>
        <LinkButton href="/contribute">+ New project</LinkButton>
      </div>

      {submitted && <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">Your project was submitted for review. You'll be notified by email.</div>}

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1 text-sm ${tab === t.key ? "bg-brand-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
            {t.label}{t.key && counts[t.key] ? ` (${counts[t.key]})` : ""}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {loadingP ? <p className="text-stone-500">Loading…</p> : shown.map((p) => (
          <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-stone-900">{p.title || "Untitled draft"}</p>
              <p className="text-sm text-stone-500">
                {p.authors?.map((a) => a.name).filter(Boolean).join(", ") || "—"} · {p.files?.length || 0} file(s) · updated {new Date(p.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge color={statusColor[p.status] || "slate"}>{PROJECT_STATUS_LABEL[p.status as ProjectStatus] || p.status}</Badge>
              {(p.status === "draft" || p.status === "changes_requested")
                ? <Link href={`/contribute?draft=${p.id}`} className="rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800">{p.status === "draft" ? "Resume" : "Revise"}</Link>
                : p.githubCommitUrl
                  ? <a href={p.githubCommitUrl} target="_blank" rel="noreferrer" className="text-sm text-accent-600 hover:underline">View on GitHub</a>
                  : <span className="text-xs text-stone-400">In review</span>}
            </div>
          </Card>
        ))}
        {!loadingP && !shown.length && (
          <Card className="p-8 text-center text-sm text-stone-600">
            {tab ? "No projects in this state." : <>You have no projects yet. <Link href="/contribute" className="text-accent-600 underline">Start one</Link>.</>}
          </Card>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl px-4 py-16 text-stone-500">Loading…</div>}>
      <DashboardInner />
    </Suspense>
  );
}
