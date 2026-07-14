"use client";
import Link from "next/link";
import { useT } from "@/components/i18n/LanguageProvider";
import { EASER_INFO, GITHUB_ORG_URL, INSTITUTION_ORDER } from "@/lib/constants";

const SOCIAL: { key: string; label: string; url: string }[] = [
  { key: "github", label: "GitHub", url: GITHUB_ORG_URL },
  { key: "linkedin", label: "LinkedIn", url: EASER_INFO.social.linkedin },
  { key: "spotify", label: "Spotify", url: EASER_INFO.social.spotify },
  { key: "youtube", label: "YouTube", url: EASER_INFO.social.youtube },
  { key: "instagram", label: "Instagram", url: EASER_INFO.social.instagram }
];

export function Footer() {
  const { t, lang } = useT();
  const L = lang === "es" ? "es" : "en";
  return (
    <footer className="mt-16 bg-brand-800 text-brand-50">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand + socials */}
          <div>
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/easer-logo.svg" alt="EASER" width={36} height={36} className="h-9 w-9 rounded bg-white/90 p-0.5" />
              <span className="font-serif text-lg font-semibold text-white">EASER<span className="font-sans font-normal text-brand-200"> Data Hub</span></span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-brand-100">
              {L === "es"
                ? "Plataforma de investigación y difusión científica del Proyecto Anillo EASER."
                : "Research management and scientific dissemination platform for the EASER initiative."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {SOCIAL.map((s) => (
                <a key={s.key} href={s.url} target="_blank" rel="noreferrer"
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-brand-50 transition hover:bg-white/10">
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">{L === "es" ? "Explorar" : "Explore"}</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/our-work" className="text-brand-100 hover:text-white hover:underline">{t("common.ourWork")}</Link></li>
              <li><Link href="/docs" className="text-brand-100 hover:text-white hover:underline">{t("common.documentation")}</Link></li>
              <li><Link href="/team" className="text-brand-100 hover:text-white hover:underline">{t("common.team")}</Link></li>
              <li><Link href="/news" className="text-brand-100 hover:text-white hover:underline">{t("common.news")}</Link></li>
              <li><Link href="/contact" className="text-brand-100 hover:text-white hover:underline">{t("common.contact")}</Link></li>
            </ul>
          </div>

          {/* Partners */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">{L === "es" ? "Instituciones participantes" : "Participating institutions"}</p>
            <ul className="mt-3 space-y-2 text-sm text-brand-100">
              {INSTITUTION_ORDER.map((i) => <li key={i.canonical}>{i.canonical}</li>)}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-brand-200 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Proyecto EASER · ANID</span>
          <a href={EASER_INFO.official} target="_blank" rel="noreferrer" className="hover:text-white hover:underline">proyectoeaser.cl</a>
        </div>
      </div>
    </footer>
  );
}
