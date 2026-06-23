"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, Badge } from "@/components/ui";
import { Markdown } from "@/components/Markdown";
import { useT } from "@/components/i18n/LanguageProvider";
import { apiGet } from "@/lib/client";
import type { NewsPost } from "@/lib/types";

export default function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useT();
  const [n, setN] = useState<NewsPost | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { apiGet<NewsPost>(`/api/news/${slug}`).then(setN).catch((e) => setErr(e.message)); }, [slug]);

  if (err) return <div className="mx-auto max-w-3xl px-4 py-16"><Card className="border-amber-200 bg-amber-50 p-4 text-amber-800">{err} — <Link className="underline" href="/news">News</Link></Card></div>;
  if (!n) return <div className="mx-auto max-w-3xl px-4 py-16 text-stone-500">{t("common.loading")}</div>;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/news" className="text-sm text-accent-700 hover:underline">← News</Link>
      <h1 className="mt-3 font-serif text-3xl font-bold text-stone-900">{n.title}</h1>
      {n.subtitle && <p className="mt-2 text-lg text-stone-600">{n.subtitle}</p>}
      <p className="mt-3 text-sm text-stone-500">{n.authorName}{n.publishedAt ? ` · ${new Date(n.publishedAt).toLocaleDateString()}` : ""}</p>
      {n.tags?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{n.tags.map((tg) => <Badge key={tg}>{tg}</Badge>)}</div>}
      {n.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={n.coverImage} alt="" className="mt-6 w-full rounded-xl object-cover" />
      )}
      <div className="mt-6"><Markdown>{n.content || ""}</Markdown></div>
      {n.externalLinks && n.externalLinks.length > 0 && (
        <div className="mt-8 border-t border-stone-200 pt-4">
          <h2 className="text-sm font-semibold text-stone-700">Links</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {n.externalLinks.map((l, i) => <li key={i}><a href={l} target="_blank" rel="noreferrer" className="text-accent-700 hover:underline break-all">{l}</a></li>)}
          </ul>
        </div>
      )}
    </article>
  );
}
