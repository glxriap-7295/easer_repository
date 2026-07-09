"use client";
import Link from "next/link";
import { Card } from "@/components/ui";
import { useT } from "@/components/i18n/LanguageProvider";
import { INSTITUTION_ORDER, EASER_INFO } from "@/lib/constants";
import { PartnerLogos } from "@/components/InstitutionLogo";
import { SocialLinks } from "@/components/SocialLinks";

export default function ContactPage() {
  const { lang } = useT();
  const L = lang === "es" ? "es" : "en";
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">{L === "es" ? "Contacto" : "Contact"}</h1>
      <p className="mt-2 max-w-2xl text-stone-600">
        {L === "es"
          ? "EASER es una iniciativa de investigación financiada por ANID sobre la evolución del riesgo sísmico en Chile. Para colaboraciones, prensa o consultas:"
          : "EASER is an ANID-funded research initiative on the evolution of seismic risk in Chile. For collaborations, press or enquiries:"}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-serif text-lg font-semibold text-brand-800">{L === "es" ? "Escríbenos" : "Get in touch"}</h2>
          <p className="mt-2 text-sm text-stone-700">Email: <a className="text-accent-700 hover:underline" href={`mailto:${EASER_INFO.contact}`}>{EASER_INFO.contact}</a></p>
          <p className="mt-1 text-sm text-stone-700">{L === "es" ? "Sitio oficial" : "Official site"}: <a className="text-accent-700 hover:underline" href={EASER_INFO.official} target="_blank" rel="noreferrer">proyectoeaser.cl</a></p>

          <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-stone-500">{L === "es" ? "Redes sociales" : "Social media"}</h3>
          <SocialLinks className="mt-2" />
        </Card>

        <Card className="p-6">
          <h2 className="font-serif text-lg font-semibold text-brand-800">{L === "es" ? "Repositorio abierto" : "Open repository"}</h2>
          <p className="mt-2 text-sm text-stone-700">{L === "es" ? "Accede a los datos, herramientas computacionales y resultados publicados:" : "Access published data, computational tools and outputs:"}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/our-work" className="text-accent-700 hover:underline">{L === "es" ? "Nuestro trabajo" : "Our Work"} →</Link>
            <Link href="/browse" className="text-accent-700 hover:underline">{L === "es" ? "Explorar" : "Browse"} →</Link>
          </div>
        </Card>
      </div>

      <h2 className="mt-10 text-xl font-bold text-stone-900">{L === "es" ? "Instituciones participantes" : "Participating institutions"}</h2>
      <PartnerLogos className="mt-4" />
      <p className="mt-3 text-xs text-stone-500">{INSTITUTION_ORDER.map((i) => i.canonical).join(" · ")}</p>
    </div>
  );
}
