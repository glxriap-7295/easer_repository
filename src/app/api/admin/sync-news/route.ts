import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { listNews, saveNews } from "@/lib/store";
import { ok, fail, newId } from "@/lib/api";
import type { NewsPost } from "@/lib/types";

export const runtime = "nodejs";

// Official EASER news (proyectoeaser.cl). Idempotent by stable slug — safe to
// run repeatedly. Stored locally in Firestore for performance (no scraping on
// every page load).
const OFFICIAL: { slug: string; title: string; subtitle: string; date: string; link: string }[] = [
  {
    slug: "albanileria-estructural-riesgo-sismico",
    title: "Seminario abordará los aprendizajes y desafíos de la albañilería estructural frente al riesgo sísmico",
    subtitle: "El Proyecto Anillo EASER realizará el seminario “Albañilería estructural: aprendizajes pasados y desafíos modernos”.",
    date: "2025-12-02",
    link: "https://www.proyectoeaser.cl/2025/12/02/seminario-abordara-los-aprendizajes-y-desafios-de-la-albanileria-estructural-frente-al-riesgo-sismico/"
  },
  {
    slug: "easer-segunda-jornada-iv-congreso-amenaza-sismica",
    title: "Investigadores de EASER participaron en la segunda jornada del IV Congreso de Amenaza Sísmica",
    subtitle: "Investigadores del proyecto EASER participaron con presentaciones académicas en el IV Congreso de Amenaza Sísmica.",
    date: "2025-11-15",
    link: "https://www.proyectoeaser.cl/2025/11/15/investigadores-de-easer-participaron-en-la-segunda-jornada-del-iv-congreso-de-amenaza-sismica/"
  },
  {
    slug: "rosita-junemann-inauguro-iv-congreso-amenaza-sismica",
    title: "Rosita Jünemann inauguró el IV Congreso de Amenaza Sísmica",
    subtitle: "La investigadora Rosita Jünemann inauguró el programa de presentaciones académicas del IV Congreso de Amenaza Sísmica.",
    date: "2025-11-15",
    link: "https://www.proyectoeaser.cl/2025/11/15/rosita-junemann-inauguro-el-iv-congreso-de-amenaza-sismica/"
  }
];

export async function POST(req: NextRequest) {
  try { await requireRole(req, "admin"); } catch (e: any) { return fail(e.message, e.status || 403); }

  const existing = await listNews();
  const bySlug = new Set(existing.map((n) => n.slug));
  const now = new Date().toISOString();
  let added = 0;

  for (const a of OFFICIAL) {
    if (bySlug.has(a.slug)) continue;
    const post: NewsPost = {
      id: newId("nw"),
      slug: a.slug,
      title: a.title,
      subtitle: a.subtitle,
      content: `${a.subtitle}\n\n[Read the full article on proyectoeaser.cl](${a.link})`,
      authorName: "EASER",
      tags: ["Noticias", "proyectoeaser.cl"],
      status: "published",
      pinned: false,
      externalLinks: [a.link],
      publishedAt: new Date(a.date).toISOString(),
      createdAt: now,
      updatedAt: now
    };
    await saveNews(post);
    added++;
  }
  return ok({ added, total: OFFICIAL.length, message: `${added} article(s) synced from proyectoeaser.cl` });
}
