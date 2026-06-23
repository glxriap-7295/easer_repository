"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import { INSTITUTION_ORDER, institutionRank } from "@/lib/constants";
import type { TeamMember } from "@/lib/types";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}
function Avatar({ m, size }: { m: TeamMember; size: number }) {
  const cls = `rounded-full object-cover`;
  return m.photoURL ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={m.photoURL} alt={m.name} width={size} height={size} className={cls} style={{ width: size, height: size }} />
  ) : (
    <span className="grid place-items-center rounded-full bg-brand-700 font-semibold text-white" style={{ width: size, height: size }}>{initials(m.name)}</span>
  );
}
function LinkedIn({ url }: { url?: string }) {
  if (!url) return null;
  return <a href={url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium text-accent-700 hover:underline">LinkedIn ↗</a>;
}

export default function TeamPage() {
  const { lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiGet<TeamMember[]>("/api/team").then(setTeam).catch(() => setTeam([])).finally(() => setLoading(false)); }, []);

  const director = team.find((m) => m.group === "director");
  const pis = team.filter((m) => m.group === "pi");
  const full = team.filter((m) => m.group === "team");
  const piInstitutions = Array.from(new Set(pis.map((p) => p.institution || "—")))
    .sort((a, b) => institutionRank(a) - institutionRank(b));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">{L === "es" ? "Equipo" : "Team"}</h1>
      <p className="mt-2 max-w-2xl text-stone-600">{L === "es" ? "El equipo multidisciplinario de investigación detrás de EASER." : "The multidisciplinary research team behind EASER."}</p>

      {loading ? <p className="mt-8 text-stone-500">…</p> : (
        <>
          {/* Director */}
          {director && (
            <section className="mt-10 flex flex-col items-center gap-4 rounded-2xl bg-brand-50 p-8 text-center">
              <Avatar m={director} size={140} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">{L === "es" ? "Director" : "Director"}</p>
                <h2 className="mt-1 font-serif text-2xl font-bold text-stone-900">{director.name}</h2>
                <p className="text-stone-600">{director.role}{director.institution ? ` · ${director.institution}` : ""}</p>
                {director.bio && <p className="mx-auto mt-2 max-w-xl text-sm text-stone-600">{director.bio}</p>}
                <LinkedIn url={director.linkedin} />
              </div>
            </section>
          )}

          {/* Principal Investigators grouped by institution */}
          {pis.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-stone-900">{L === "es" ? "Investigadores principales" : "Principal Investigators"}</h2>
              {piInstitutions.map((inst) => (
                <div key={inst} className="mt-5">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{inst}</h3>
                  <div className="mt-3 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {pis.filter((p) => (p.institution || "—") === inst).map((p) => (
                      <Card key={p.id} className="flex flex-col items-center p-5 text-center">
                        <Avatar m={p} size={88} />
                        <p className="mt-3 font-medium text-stone-900">{p.name}</p>
                        <p className="text-xs text-stone-500">{p.role}</p>
                        <LinkedIn url={p.linkedin} />
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Full research team */}
          {full.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-stone-900">{L === "es" ? "Equipo de investigación" : "Full Research Team"}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {full.map((m) => (
                  <Card key={m.id} className="flex items-center gap-3 p-4">
                    <Avatar m={m} size={52} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-stone-900">{m.name}</p>
                      <p className="truncate text-xs text-stone-500">{m.role}{m.institution ? ` · ${m.institution}` : ""}</p>
                      <LinkedIn url={m.linkedin} />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {!team.length && (
            <Card className="mt-10 p-8 text-center text-sm text-stone-600">{L === "es" ? "El equipo se publicará próximamente." : "The team will be published soon."}</Card>
          )}

          {/* Partners */}
          <section className="mt-12">
            <h2 className="text-xl font-bold text-stone-900">{L === "es" ? "Instituciones participantes" : "Partners"}</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {INSTITUTION_ORDER.map((i) => (
                <Card key={i.canonical} className="flex items-center justify-center p-4 text-center text-sm font-medium text-stone-700">{i.short}</Card>
              ))}
            </div>
            <p className="mt-3 text-xs text-stone-500">{INSTITUTION_ORDER.map((i) => i.canonical).join(" · ")}</p>
          </section>
        </>
      )}
    </div>
  );
}
