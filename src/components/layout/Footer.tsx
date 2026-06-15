"use client";
import Link from "next/link";
import { useT } from "@/components/i18n/LanguageProvider";

const INSTITUTIONS: { name: string; url: string }[] = [
  { name: "EASER", url: "https://www.proyectoeaser.cl/" },
  { name: "Universidad de Chile", url: "https://www.uchile.cl/" },
  { name: "SENAPRED", url: "https://www.senapred.cl/" },
  { name: "ANID", url: "https://www.anid.cl/" }
];

export function Footer() {
  const { t } = useT();
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-stone-500">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/easer-logo.svg" alt="EASER" width={32} height={32} className="h-8 w-8" />
              <p className="font-serif text-base font-semibold text-stone-800">{t("common.appName")}</p>
            </div>
            <p className="mt-2">GitHub-centric research repository management for the EASER initiative.</p>
            <Link href="/researchers" className="mt-2 inline-block text-accent-600 hover:underline">{t("researchers.title")}</Link>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Project & partners</p>
            <ul className="space-y-1">
              {INSTITUTIONS.map((i) => (
                <li key={i.name}>
                  <a href={i.url} target="_blank" rel="noreferrer" className="hover:text-brand-700 hover:underline">{i.name}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-8 text-xs text-stone-400">
          Source of truth:{" "}
          <a className="underline" href="https://github.com/glxriap-7295/easer_repository" target="_blank" rel="noreferrer">github.com/glxriap-7295/easer_repository</a>
          {" · "}
          <a className="underline" href="https://www.proyectoeaser.cl/" target="_blank" rel="noreferrer">proyectoeaser.cl</a>
        </p>
      </div>
    </footer>
  );
}
