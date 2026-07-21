"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { CategoryVisual } from "@/components/ui/visuals";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import { EASER_INFO, GITHUB_ORG_URL, eventTypeLabel } from "@/lib/constants";
import type { NewsPost } from "@/lib/types";

// Brand icons (inline, monochrome — tinted per channel).
const ICONS: Record<string, string> = {
  linkedin: "M4.98 3.5A2.5 2.5 0 1 0 5 8.5a2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95C20.4 8.75 21 11 21 14.1V21h-4v-6c0-1.43-.03-3.27-2-3.27-2 0-2.3 1.56-2.3 3.17V21H9z",
  spotify: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.6 14.4a.75.75 0 0 1-1 .25c-2.8-1.7-6.3-2.1-10.4-1.16a.75.75 0 1 1-.34-1.46c4.5-1 8.4-.56 11.5 1.33.36.22.47.68.24 1.04zm1.2-2.9a.94.94 0 0 1-1.28.3c-3.2-1.96-8.1-2.53-11.9-1.38a.94.94 0 1 1-.54-1.8c4.3-1.3 9.7-.66 13.4 1.6.44.27.58.85.32 1.28zm.1-3c-3.8-2.26-10.2-2.47-13.9-1.35a1.12 1.12 0 1 1-.65-2.15c4.2-1.28 11.3-1.03 15.7 1.57a1.12 1.12 0 0 1-1.15 1.93z",
  youtube: "M23 12s0-3.4-.43-5.02a2.6 2.6 0 0 0-1.83-1.84C19.12 4.7 12 4.7 12 4.7s-7.12 0-8.74.44A2.6 2.6 0 0 0 1.43 6.98C1 8.6 1 12 1 12s0 3.4.43 5.02c.24.9.94 1.6 1.83 1.84 1.62.44 8.74.44 8.74.44s7.12 0 8.74-.44a2.6 2.6 0 0 0 1.83-1.84C23 15.4 23 12 23 12zM9.75 15.5v-7l6 3.5z",
  instagram: "M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2zm0 3.05A6.75 6.75 0 1 0 18.75 12 6.75 6.75 0 0 0 12 5.25zm0 11.13A4.38 4.38 0 1 1 16.38 12 4.38 4.38 0 0 1 12 16.38zm6.99-11.4a1.58 1.58 0 1 1-1.58-1.57 1.58 1.58 0 0 1 1.58 1.57z",
  github: "M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"
};
const TINT: Record<string, string> = { linkedin: "text-[#0a66c2]", spotify: "text-[#1db954]", youtube: "text-[#ff0000]", instagram: "text-[#e1306c]", github: "text-stone-800" };

function ChannelCard({ ch, title, note, url, cta }: { ch: string; title: string; note: string; url: string; cta: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="group flex gap-3 rounded-xl border border-stone-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-card">
      <span className={`mt-0.5 shrink-0 ${TINT[ch]}`}><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d={ICONS[ch]} /></svg></span>
      <span className="min-w-0">
        <span className="block font-serif font-semibold text-stone-900">{title}</span>
        <span className="mt-0.5 block text-xs text-stone-500">{note}</span>
        <span className="mt-1 inline-block text-xs font-medium text-accent-700 group-hover:underline">{cta} ↗</span>
      </span>
    </a>
  );
}

export default function NewsPage() {
  const { lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiGet<NewsPost[]>("/api/news").then(setNews).catch(() => setNews([])).finally(() => setLoading(false)); }, []);

  // Split articles from events. Events surface only in the Upcoming Events section.
  const articles = news.filter((n) => n.kind !== "event");
  const featured = articles.find((n) => n.pinned) || articles[0];
  const rest = articles.filter((n) => n.id !== featured?.id).slice(0, 6);

  // Upcoming events: published, start date today or later, sorted chronologically.
  const today = new Date().toISOString().slice(0, 10);
  const events = news
    .filter((n) => n.kind === "event" && n.startDate && n.startDate >= today)
    .sort((a, b) => `${a.startDate}T${a.startTime || "00:00"}`.localeCompare(`${b.startDate}T${b.startTime || "00:00"}`));
  const fmtEventDate = (n: NewsPost) => {
    if (!n.startDate) return "";
    const d = new Date(`${n.startDate}T${n.startTime || "00:00"}`);
    return d.toLocaleDateString(L === "es" ? "es-CL" : "en-US", { day: "numeric", month: "short", year: "numeric" }) + (n.startTime ? ` · ${n.startTime}` : "");
  };

  const T = {
    title: L === "es" ? "Novedades" : "News",
    channels: L === "es" ? "Canales Oficiales" : "Official Channels",
    featured: L === "es" ? "Historia Destacada" : "Featured Story",
    latest: L === "es" ? "Últimas Noticias" : "Latest News",
    events: L === "es" ? "Próximos Eventos" : "Upcoming Events"
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-stone-900">{T.title}</h1>
      <p className="mt-3 max-w-2xl text-stone-600">{L === "es" ? "Noticias, divulgación científica y recursos multimedia del Proyecto EASER." : "News, scientific outreach and multimedia resources from the EASER Project."}</p>

      {loading ? <p className="mt-8 text-stone-500">…</p> : (
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.7fr_1fr]">
          {/* Main column */}
          <div>
            {/* Featured story */}
            {featured && (
              <section>
                <h2 className="font-serif text-xl font-bold text-stone-900">{T.featured}</h2>
                <Link href={`/news/${featured.slug}`} className="group mt-4 block">
                  <Card className="overflow-hidden transition group-hover:shadow-card">
                    {featured.coverImage
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={featured.coverImage} alt="" className="h-64 w-full object-cover" />
                      : <CategoryVisual seed={featured.id} rounded="rounded-none" className="h-64 w-full" />}
                    <div className="p-6">
                      <Badge color="amber">{(featured.tags?.[0] || (L === "es" ? "Destacado" : "Featured"))}</Badge>
                      <h3 className="mt-2 font-serif text-2xl font-bold text-stone-900 group-hover:text-brand-800">{featured.title}</h3>
                      {featured.subtitle && <p className="mt-2 text-stone-600">{featured.subtitle}</p>}
                      <p className="mt-3 text-xs text-stone-400">{[featured.authorName, featured.publishedAt ? new Date(featured.publishedAt).toLocaleDateString() : ""].filter(Boolean).join(" · ")}</p>
                      <span className="mt-3 inline-block text-sm font-medium text-accent-700">{L === "es" ? "Leer más" : "Read more"} →</span>
                    </div>
                  </Card>
                </Link>
              </section>
            )}

            {/* Latest news */}
            {rest.length > 0 && (
              <section className="mt-12">
                <h2 className="font-serif text-xl font-bold text-stone-900">{T.latest}</h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {rest.map((n) => (
                    <Link key={n.id} href={`/news/${n.slug}`} className="group">
                      <Card className="flex h-full flex-col overflow-hidden transition group-hover:-translate-y-0.5 group-hover:shadow-card">
                        {n.coverImage
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={n.coverImage} alt="" className="h-36 w-full object-cover" />
                          : <CategoryVisual seed={n.id} rounded="rounded-none" className="h-36 w-full" />}
                        <div className="flex flex-1 flex-col p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-700">{(n.tags?.[0] || (L === "es" ? "Noticia" : "News"))} · {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : ""}</p>
                          <h3 className="mt-1 font-serif font-semibold text-stone-900 group-hover:text-brand-800">{n.title}</h3>
                          {n.subtitle && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{n.subtitle}</p>}
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Upcoming events — live, published, future-dated, chronological */}
            <section className="mt-12">
              <h2 className="font-serif text-xl font-bold text-stone-900">{T.events}</h2>
              {events.length === 0 ? (
                <Card className="mt-4 p-6 text-sm text-stone-600">{L === "es" ? "No hay eventos programados por el momento. Vuelve pronto para conocer seminarios, congresos y actividades de difusión." : "No events scheduled at the moment. Check back soon for seminars, conferences and outreach activities."}</Card>
              ) : (
                <div className="mt-4 space-y-4">
                  {events.map((n) => (
                    <Card key={n.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                      <div className="shrink-0 rounded-lg bg-brand-50 px-4 py-3 text-center sm:w-28">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{fmtEventDate(n)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge color="amber">{eventTypeLabel(n.eventType, L)}</Badge>
                          {n.location && <span className="text-xs text-stone-500">📍 {n.location}</span>}
                        </div>
                        <h3 className="mt-1 font-serif font-semibold text-stone-900">{n.title}</h3>
                        {n.subtitle && <p className="mt-0.5 line-clamp-2 text-sm text-stone-600">{n.subtitle}</p>}
                      </div>
                      <div className="shrink-0">
                        {n.registrationUrl
                          ? <a href={n.registrationUrl} target="_blank" rel="noreferrer" className="inline-block rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800">{L === "es" ? "Inscribirse" : "Register"}</a>
                          : <Link href={`/news/${n.slug}`} className="inline-block rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50">{L === "es" ? "Más información" : "Learn More"}</Link>}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar: Official Channels */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <h2 className="font-serif text-xl font-bold text-stone-900">{T.channels}</h2>
            <div className="mt-4 space-y-3">
              <ChannelCard ch="linkedin" title="LinkedIn" url={EASER_INFO.social.linkedin} cta={L === "es" ? "Ver publicaciones" : "Visit LinkedIn"} note={L === "es" ? "Anuncios oficiales, actualizaciones y colaboraciones." : "Official announcements, updates and collaborations."} />
              <ChannelCard ch="spotify" title={L === "es" ? "Podcast (Spotify)" : "Podcast (Spotify)"} url={EASER_INFO.social.spotify} cta={L === "es" ? "Escuchar en Spotify" : "Listen on Spotify"} note={L === "es" ? "Conversaciones con el equipo de investigación y expertos en el área sísmica." : "Conversations with the research team and experts in the seismic field."} />
              <ChannelCard ch="youtube" title="YouTube" url={EASER_INFO.social.youtube} cta={L === "es" ? "Ver en YouTube" : "Watch on YouTube"} note={L === "es" ? "Seminarios, charlas y actividades de divulgación científica." : "Seminars, talks and scientific outreach activities."} />
              <ChannelCard ch="instagram" title="Instagram" url={EASER_INFO.social.instagram} cta={L === "es" ? "Ver en Instagram" : "View on Instagram"} note={L === "es" ? "Actividades, eventos y contenido detrás de cámaras del proyecto." : "Activities, events and behind-the-scenes content from the project."} />
              <ChannelCard ch="github" title="GitHub" url={GITHUB_ORG_URL} cta={L === "es" ? "Explorar en GitHub" : "Explore on GitHub"} note={L === "es" ? "Código fuente, datasets y herramientas computacionales abiertas." : "Source code, datasets and open computational tools."} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
