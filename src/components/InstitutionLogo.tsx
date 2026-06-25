"use client";
import { INSTITUTION_ORDER, institutionLogo } from "@/lib/constants";

// Renders an institution logo with graceful fallback to its short name.
export function InstitutionLogo({ name, className = "h-7", showName = false }: { name: string; className?: string; showName?: boolean }) {
  const logo = institutionLogo(name);
  if (!logo) return <span className="text-xs font-medium text-stone-600">{name}</span>;
  return (
    <span className="inline-flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logo} alt={name} className={`${className} w-auto object-contain`} />
      {showName && <span className="text-xs text-stone-600">{name}</span>}
    </span>
  );
}

// Full ordered partner logo row used on Home, Team and Contact.
export function PartnerLogos({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 items-center gap-3 sm:grid-cols-3 lg:grid-cols-6 ${className}`}>
      {INSTITUTION_ORDER.map((i) => (
        <div key={i.canonical} className="flex items-center justify-center rounded-lg border border-stone-200 bg-white p-3" title={i.canonical}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={i.logoPath} alt={i.canonical} className="h-12 w-auto object-contain" />
        </div>
      ))}
    </div>
  );
}
