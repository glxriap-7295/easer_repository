"use client";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { apiGet } from "@/lib/client";
import type { RepoTreeNode } from "@/lib/types";

export function RepoBrowser() {
  const [path, setPath] = useState("");
  const [nodes, setNodes] = useState<RepoTreeNode[]>([]);
  const [file, setFile] = useState<{ path: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true); setError(""); setFile(null);
    apiGet<{ nodes: RepoTreeNode[] }>(`/api/repo/tree?path=${encodeURIComponent(path)}`)
      .then((d) => setNodes(d.nodes))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [path]);

  async function open(node: RepoTreeNode) {
    if (node.type === "tree") { setPath(node.path); return; }
    if (/\.(png|jpg|jpeg|gif|pdf|zip|xlsx?|shp|tif|tiff)$/i.test(node.path)) {
      window.open(`https://github.com/glxriap-7295/easer_repository/blob/main/${node.path}`, "_blank");
      return;
    }
    try {
      const d = await apiGet<{ path: string; content: string }>(`/api/repo/file?path=${encodeURIComponent(node.path)}`);
      setFile(d);
    } catch (e: any) { setError(e.message); }
  }

  const crumbs = path ? path.split("/") : [];
  return (
    <div>
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm">
        <button className="text-brand-600 hover:underline" onClick={() => { setPath(""); setFile(null); }}>root</button>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="text-slate-400">/</span>
            <button className="text-brand-600 hover:underline" onClick={() => setPath(crumbs.slice(0, i + 1).join("/"))}>{c}</button>
          </span>
        ))}
      </nav>

      {error && (
        <Card className="p-4 text-sm text-amber-700 bg-amber-50 border-amber-200">
          {error} — set <code>GITHUB_TOKEN</code> to browse the live repository.
        </Card>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : file ? (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-sm text-slate-700">{file.path}</span>
            <button className="text-sm text-brand-600 hover:underline" onClick={() => setFile(null)}>← back</button>
          </div>
          {/\.(md|markdown)$/i.test(file.path)
            ? <Markdown>{file.content}</Markdown>
            : <pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">{file.content}</pre>}
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100">
          {nodes.map((n) => (
            <button key={n.sha} onClick={() => open(n)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50">
              <span className="flex items-center gap-2">
                <span>{n.type === "tree" ? "📁" : "📄"}</span>
                <span className="text-sm text-slate-800">{n.path.split("/").pop()}</span>
              </span>
              {n.type === "blob" && n.size != null && <Badge>{(n.size / 1024).toFixed(1)} KB</Badge>}
            </button>
          ))}
          {!nodes.length && <p className="px-4 py-6 text-sm text-slate-500">Empty.</p>}
        </Card>
      )}
    </div>
  );
}
