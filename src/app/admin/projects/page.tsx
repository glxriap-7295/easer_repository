"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Badge, Button } from "@/components/ui";
import { apiGet } from "@/lib/client";
import { PROJECT_STATUS_LABEL, type ProjectStatus } from "@/lib/constants";
import type { Project } from "@/lib/types";

const statusColor: Record<string, "slate" | "amber" | "green" | "red" | "blue"> = {
  draft: "slate", submitted: "amber", under_review: "amber", changes_requested: "red",
  approved: "green", published: "green", rejected: "red"
};
const TABS = ["submitted", "under_review", "changes_requested", "approved", "published", "rejected", ""];

export default function ProjectsQueue() {
  const [rows, setRows] = useState<Project[]>([]);
  const [tab, setTab] = useState("submitted");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  function load() {
    setLoading(true); setErr("");
    apiGet<Project[]>(`/api/projects?scope=review${tab ? `&status=${tab}` : ""}`, true)
      .then(setRows).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }
  useEffect(load, [tab]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Review queue</h1>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>
      {err && <Card className="mt-4 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{err}</Card>}

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t || "all"} onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1 text-sm ${tab === t ? "bg-brand-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
            {t ? PROJECT_STATUS_LABEL[t as ProjectStatus] : "All"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {loading ? <p className="text-stone-500">Loading…</p> : rows.map((p) => (
          <Card key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="truncate font-medium text-stone-900">{p.title}</p>
              <p className="text-sm text-stone-500">{p.authors?.map((a) => a.name).join(", ")} · {p.institutions?.map((i) => i.name).join(", ")}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge color={statusColor[p.status] || "slate"}>{PROJECT_STATUS_LABEL[p.status as ProjectStatus]}</Badge>
              <Link href={`/admin/projects/${p.id}`} className="rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-800">Review</Link>
            </div>
          </Card>
        ))}
        {!loading && !rows.length && <p className="text-sm text-stone-500">Nothing here.</p>}
      </div>
    </div>
  );
}
