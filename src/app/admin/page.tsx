"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Badge, Button } from "@/components/ui";
import { apiGet } from "@/lib/client";
import type { Contribution } from "@/lib/types";

const statusColor: Record<string, "slate" | "amber" | "green" | "red" | "blue"> = {
  metadata_complete: "amber", draft_generated: "amber", in_review: "amber",
  approved: "green", published: "green", rejected: "red", submitted: "slate"
};

export default function AdminDashboard() {
  const [rows, setRows] = useState<Contribution[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [list, s] = await Promise.all([
        apiGet<Contribution[]>(`/api/contributions${filter ? `?status=${filter}` : ""}`, true),
        apiGet("/api/stats", true)
      ]);
      setRows(list); setStats(s);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-stone-900">Curator dashboard</h1>
        <Button variant="secondary" onClick={load}>Refresh</Button>
      </div>

      {error && (
        <Card className="mt-6 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {error}. If you are not signed in, go to <Link className="underline" href="/login">login</Link>.
          In development, admin access is granted automatically for the demo.
        </Card>
      )}

      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Total contributions" value={stats.total} />
          <Stat label="Pending review" value={stats.pendingReview} />
          <Stat label="Published" value={stats.published} />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {["", "metadata_complete", "in_review", "approved", "published", "rejected"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-sm ${filter === s ? "bg-brand-600 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
            {s === "" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {loading ? <p className="text-stone-500">Loading…</p> : rows.map((c) => (
          <Card key={c.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-stone-900">{c.metadata.title}</p>
              <p className="text-sm text-stone-500">{c.submitter.name} · {c.submitter.affiliation} · {new Date(c.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge color={statusColor[c.status] || "slate"}>{c.status.replace("_", " ")}</Badge>
              <Link href={`/admin/review/${c.id}`} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">Review</Link>
            </div>
          </Card>
        ))}
        {!loading && !rows.length && <p className="text-sm text-stone-500">No contributions{filter ? ` with status “${filter}”` : ""} yet.</p>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-brand-700">{value ?? 0}</p>
    </Card>
  );
}
