"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import { TEAM_GROUPS, institutionRank } from "@/lib/constants";
import { PartnerLogos } from "@/components/InstitutionLogo";
import type { TeamMember } from "@/lib/types";

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}
function Avatar({ m, size }: { m: TeamMember; size: number }) {
  return m.photoURL ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={m.photoURL} alt={m.name} className="rounded-full object-cover" style={{ width: size, height: size }} />
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
  const subdirector = team.find((m) => m.group === "subdirector");
  // Remaining groups (leadership handled separately), in canonical order.
  const groups = TEAM_GROUPS.filter((g) => g.value !== "director" && g.value !== "subdirector")
    .map((g) => ({ ...g, members: team.filter((m) => m.group === g.value) }))
    .filter((g) => g.members.length);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-stone-900">{L === "es" ? "Nuestro Equipo" : "Our Team"}</h1>
      <p className="mt-3 max-w-2xl text-stone-600">{L === "es" ? "Un equipo multidisciplinario de investigadores, profesionales y estudiantes comprometidos con la investigación sísmica." : "A multidisciplinary team of researchers, professionals and students committed to seismic research."}</p>

      {loading ? <p className="mt-8 text-stone-500">…</p> : (
        <>
          {/* Leadership */}
          {(director || subdirector) && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-stone-900">{L === "es" ? "Dirección" : "Leadership"}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {[["director", director], ["subdirector", subdirector]].map(([role, m]) =>
                  m ? (
                    <div key={role as string} className="flex items-center gap-5 rounded-2xl bg-brand-50 p-6">
                      <Avatar m={m as any} size={104} />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">{role === "director" ? (L === "es" ? "Director" : "Director") : (L === "es" ? "Subdirector" : "Subdirector")}</p>
                        <h3 className="mt-1 font-serif text-xl font-bold text-stone-900">{(m as any).name}</h3>
                        <p className="text-sm text-stone-600">{(m as any).role}{(m as any).institution ? ` · ${(m as any).institution}` : ""}</p>
                        <LinkedIn url={(m as any).linkedin} />
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </section>
          )}

          {/* Ordered role groups */}
          {groups.map((g) => (
            <section key={g.value} className="mt-12">
              <h2 className="text-xl font-bold text-stone-900">{g.label[L]}</h2>
              {g.value === "pi" ? (
                Array.from(new Set(g.members.map((p) => p.institution || "—")))
                  .sort((a, b) => institutionRank(a) - institutionRank(b))
                  .map((inst) => (
                    <div key={inst} className="mt-5">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">{inst}</h3>
                      <div className="mt-3 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {g.members.filter((p) => (p.institution || "—") === inst).map((p) => (
                          <Card key={p.id} className="flex flex-col items-center p-5 text-center">
                            <Avatar m={p} size={88} />
                            <p className="mt-3 font-medium text-stone-900">{p.name}</p>
                            <p className="text-xs text-stone-500">{p.role}</p>
                            <LinkedIn url={p.linkedin} />
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {g.members.map((m) => (
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
              )}
            </section>
          ))}

          {!team.length && (
            <Card className="mt-10 p-8 text-center text-sm text-stone-600">{L === "es" ? "El equipo se publicará próximamente." : "The team will be published soon."}</Card>
          )}

          {/* Partners */}
          <section className="mt-12">
            <h2 className="text-xl font-bold text-stone-900">{L === "es" ? "Instituciones participantes" : "Partners"}</h2>
            <PartnerLogos className="mt-5" />
          </section>
        </>
      )}
    </div>
  );
}
