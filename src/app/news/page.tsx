"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import type { NewsPost } from "@/lib/types";

export default function NewsPage() {
  const { lang } = useT();
  const L = lang === "es" ? "es" : "en";
  const [news, setNews] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiGet<NewsPost[]>("/api/news").then(setNews).catch(() => setNews([])).finally(() => setLoading(false)); }, []);

  const pinned = news.find((n) => n.pinned) || news[0];
  const rest = news.filter((n) => n.id !== pinned?.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold text-stone-900">{L === "es" ? "Noticias" : "News"}</h1>
      <p className="mt-2 text-stone-600">{L === "es" ? "Novedades, artículos y actividades del proyecto EASER." : "Updates, articles and activities from the EASER project."}</p>

      {loading ? <p className="mt-8 text-stone-500">…</p>
        : !news.length ? <Card className="mt-8 p-8 text-center text-sm text-stone-600">{L === "es" ? "Aún no hay noticias publicadas." : "No news published yet."}</Card>
        : (
          <>
            {pinned && (
              <Link href={`/news/${pinned.slug}`} className="mt-8 block">
                <Card className="overflow-hidden transition hover:shadow-card md:flex">
                  {pinned.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pinned.coverImage} alt="" className="h-56 w-full object-cover md:h-auto md:w-1/2" />
                  )}
                  <div className="p-6">
                    <Badge color="amber">{L === "es" ? "Destacado" : "Featured"}</Badge>
                    <h2 className="mt-2 font-serif text-2xl font-bold text-stone-900">{pinned.title}</h2>
                    {pinned.subtitle && <p className="mt-2 text-stone-600">{pinned.subtitle}</p>}
                    <p className="mt-3 text-xs text-stone-400">{pinned.authorName} · {pinned.publishedAt ? new Date(pinned.publishedAt).toLocaleDateString() : ""}</p>
                  </div>
                </Card>
              </Link>
            )}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((n) => (
                <Link key={n.id} href={`/news/${n.slug}`}>
                  <Card className="flex h-full flex-col overflow-hidden transition hover:shadow-card">
                    {n.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.coverImage} alt="" className="h-40 w-full object-cover" />
                    )}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-serif font-semibold text-stone-900">{n.title}</h3>
                      {n.subtitle && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{n.subtitle}</p>}
                      <div className="mt-auto pt-3 text-xs text-stone-400">{n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : ""}</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
    </div>
  );
}
