"use client";
import { EASER_INFO, GITHUB_ORG_URL } from "@/lib/constants";

// Central social bar. Instagram/GitHub are live; LinkedIn/Spotify/YouTube are
// gracefully disabled until official URLs are added to EASER_INFO.social.
const ITEMS: { key: string; label: string; url: string }[] = [
  { key: "instagram", label: "Instagram", url: EASER_INFO.social.instagram || "" },
  { key: "linkedin", label: "LinkedIn", url: EASER_INFO.social.linkedin || "" },
  { key: "spotify", label: "Spotify", url: EASER_INFO.social.spotify || "" },
  { key: "youtube", label: "YouTube", url: EASER_INFO.social.youtube || "" },
  { key: "github", label: "GitHub", url: GITHUB_ORG_URL || "" }
];

export function SocialLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {ITEMS.map((s) =>
        s.url ? (
          <a key={s.key} href={s.url} target="_blank" rel="noreferrer" className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100">{s.label}</a>
        ) : (
          <span key={s.key} title="Coming soon" aria-disabled className="cursor-not-allowed rounded-lg border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-400">{s.label}</span>
        )
      )}
    </div>
  );
}
