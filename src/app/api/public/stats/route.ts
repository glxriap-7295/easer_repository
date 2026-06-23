import { listProjects, listTeam, listNews } from "@/lib/store";
import { ok } from "@/lib/api";
export const runtime = "nodejs";

// Real institutional impact numbers derived from repository + site data.
export async function GET() {
  const [projects, team, news] = await Promise.all([
    listProjects(), listTeam(), listNews({ publishedOnly: true })
  ]);
  const published = projects.filter((p) => ["approved", "published"].includes(p.status));
  let datasets = 0, models = 0, reports = 0;
  for (const p of published) for (const f of p.files || []) {
    if (f.category === "dataset") datasets++;
    else if (f.category === "model") models++;
    else if (f.category === "report") reports++;
  }
  return ok({
    projects: published.length,
    researchers: team.length,
    datasets, models,
    publications: reports,
    news: news.length
  });
}
