"use client";
import { useState } from "react";
import { INSTITUTION_ORDER, institutionLogo } from "@/lib/constants";

function shortFor(name: string): string {
  const hit = INSTITUTION_ORDER.find((i) => i.canonical.toLowerCase() === name.trim().toLowerCase()
    || i.aliases.some((a) => name.toLowerCase().includes(a)));
  return hit?.short || name;
}

// Renders an institution logo with graceful fallback to its short name if the
// image is missing/unreadable (so the UI never shows a broken image).
export function InstitutionLogo({ name, className = "h-7", showName = false }: { name: string; className?: string; showName?: boolean }) {
  const logo = institutionLogo(name);
  const [failed, setFailed] = useState(false);
  if (!logo || failed) return <span className="text-xs font-semibold text-stone-600">{shortFor(name)}</span>;
  return (
    <span className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt={name} className={`${className} w-auto object-contain`} onError={() => setFailed(true)} />
      {showName && <span className="text-xs text-stone-600">{name}</span>}
    </span>
  );
}

function LogoCell({ src, name, short }: { src: string; name: string; short: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-28 items-center justify-center rounded-lg border border-stone-200 bg-white p-4" title={name}>
      {failed ? (
        <span className="text-sm font-semibold text-stone-600">{short}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="max-h-16 max-w-full w-auto object-contain" onError={() => setFailed(true)} />
      )}
    </div>
  );
}

// Full ordered partner logo row (Home, Team, Contact). Equal sizing, no stretch.
export function PartnerLogos({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 items-stretch gap-3 sm:grid-cols-3 lg:grid-cols-6 ${className}`}>
      {INSTITUTION_ORDER.map((i) => (
        <LogoCell key={i.canonical} src={i.logoPath} name={i.canonical} short={i.short} />
      ))}
    </div>
  );
}
