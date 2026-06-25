"use client";
import { useState } from "react";

// Lightweight, dependency-free PDF viewer. Uses the browser's native PDF
// rendering via <iframe>. Provides open-in-new-tab and download, with a
// graceful fallback if the embed cannot load. (No react-pdf dependency.)
export function PDFViewer({ url, title, fileName }: { url: string; title?: string; fileName?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50 px-4 py-2">
        <span className="truncate font-mono text-sm text-stone-700">{fileName || title || "Document.pdf"}</span>
        <span className="flex items-center gap-3 text-sm">
          <a href={url} target="_blank" rel="noreferrer" className="text-accent-700 hover:underline">Open ↗</a>
          <a href={url} download={fileName} className="rounded-lg bg-brand-700 px-3 py-1.5 font-medium text-white hover:bg-brand-800">Download</a>
        </span>
      </div>
      {failed ? (
        <div className="p-8 text-center text-sm text-stone-600">
          Preview unavailable. <a href={url} target="_blank" rel="noreferrer" className="text-accent-700 underline">Open the PDF</a> instead.
        </div>
      ) : (
        <iframe src={url} title={title || fileName || "PDF"} className="h-[520px] w-full" onError={() => setFailed(true)} />
      )}
    </div>
  );
}
