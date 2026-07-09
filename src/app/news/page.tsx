"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import { EASER_INFO } from "@/lib/constants";
import type { NewsPost } from "@/lib/types";

function ChannelCard({ title, note, url, cta }: { title: string; note: string; url: string; cta: string }) {
  return (
    <Card className="flex h-full flex-col p-5">
      <h3 className="font-serif font-semibold text-brand-800">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-stone-600">{note}</p>
      <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-accent-700 hover:underline">{cta} ↗</a>
    </Card>
  );
}

export default function NewsPage() {
  const { lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiGet<NewsPost[]>("/api/news").then(setNews).catch(() => setNews([])).finally(() => setLoading(false)); }, []);

  const featured = news.find((n) => n.pinned) || news[0];
  const rest = news.filter((n) => n.id !== featured?.id).slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">Novedades</h1>
      <p className="mt-2 max-w-2xl text-stone-600">Noticias, divulgación científica y recursos multimedia del Proyecto EASER.</p>

      {loading ? <p className="mt-8 text-stone-500">…</p> : (
        <>
          {/* Featured story */}
          {featured && (
            <Link href={`/news/${featured.slug}`} className="mt-8 block">
              <Card className="overflow-hidden transition hover:shadow-card md:flex">
                {featured.coverImage
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={featured.coverImage} alt="" className="h-64 w-full object-cover md:h-auto md:w-1/2" />
                  : <div className="h-64 w-full bg-gradient-to-br from-brand-800 to-brand-600 md:w-1/2" />}
                <div className="p-6 md:w-1/2">
                  <Badge color="amber">{L === "es" ? "Historia destacada" : "Featured story"}</Badge>
                  <h2 className="mt-2 font-serif text-2xl font-bold text-stone-900">{featured.title}</h2>
                  {featured.subtitle && <p className="mt-2 text-stone-600">{featured.subtitle}</p>}
                  <p className="mt-3 text-xs text-stone-400">{featured.authorName} · {featured.publishedAt ? new Date(featured.publishedAt).toLocaleDateString() : ""}</p>
                  <span className="mt-3 inline-block text-sm font-medium text-accent-700">{L === "es" ? "Leer más" : "Read more"} →</span>
                </div>
              </Card>
            </Link>
          )}

          {/* Latest news */}
          {rest.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-stone-900">{L === "es" ? "Últimas noticias" : "Latest news"}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((n) => (
                  <Link key={n.id} href={`/news/${n.slug}`}>
                    <Card className="flex h-full flex-col overflow-hidden transition hover:shadow-card">
                      {n.coverImage
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={n.coverImage} alt="" className="h-40 w-full object-cover" />
                        : <div className="h-40 w-full bg-gradient-to-br from-brand-700 to-brand-500" />}
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-serif font-semibold text-stone-900">{n.title}</h3>
                        {n.subtitle && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{n.subtitle}</p>}
                        <div className="mt-auto pt-3 text-xs text-stone-400">{n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : ""}</div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Social / multimedia channels (real links; admin-populatable feeds) */}
          <section className="mt-12">
            <h2 className="text-xl font-bold text-stone-900">{L === "es" ? "Síguenos" : "Follow us"}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ChannelCard title="LinkedIn" url={EASER_INFO.social.linkedin} cta={L === "es" ? "Ver publicaciones" : "See posts"} note={L === "es" ? "Actualizaciones profesionales y avances del proyecto." : "Professional updates and project milestones."} />
              <ChannelCard title="Podcast (Spotify)" url={EASER_INFO.social.spotify} cta={L === "es" ? "Escuchar episodios" : "Listen to episodes"} note={L === "es" ? "Conversaciones sobre riesgo sísmico e investigación." : "Conversations on seismic risk and research."} />
              <ChannelCard title="YouTube" url={EASER_INFO.social.youtube} cta={L === "es" ? "Ver videos" : "Watch videos"} note={L === "es" ? "Charlas, seminarios y material de difusión." : "Talks, seminars and outreach material."} />
              <ChannelCard title="Instagram" url={EASER_INFO.social.instagram} cta={L === "es" ? "Seguir" : "Follow"} note={L === "es" ? "Momentos y difusión del equipo EASER." : "Moments and outreach from the EASER team."} />
            </div>
          </section>

          {/* Upcoming events */}
          <section className="mt-12">
            <h2 className="text-xl font-bold text-stone-900">{L === "es" ? "Próximos eventos" : "Upcoming events"}</h2>
            <Card className="mt-4 p-6 text-sm text-stone-600">{L === "es" ? "No hay eventos programados por el momento. Vuelve pronto para conocer seminarios, congresos y actividades de difusión." : "No events scheduled at the moment. Check back soon for seminars, conferences and outreach activities."}</Card>
          </section>
        </>
      )}
    </div>
  );
}
