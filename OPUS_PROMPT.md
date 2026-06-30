# OPUS TASK: Fix GitHub Publishing + Add News + Institution Logos

**Context:** EASER is a research data hub. You're working on: gloria's personal deployment (different from official site at proyectoeaser.cl).

## PROBLEM 1: Fix GitHub Publishing Issue
**Issue:** Files/drafts are being saved to GitHub with incorrect folder structure and naming.
- Current behavior: Files go to GitHub as-is or with unclear naming
- **Desired behavior:** 
  - Only "approved" projects should publish to GitHub (NOT drafts)
  - Files must follow naming convention: `{projectSlug}_{authorInitials}_{filename}`
  - Example: `tsunami-hazard-study_jd_report.pdf`
  - Project folder structure: `/Published Projects/{ProjectTitle}/{FileCategory}/{namedfile}`

**Fix location:** Check `src/app/api/projects/[id]/approve/route.ts` — ensure approval explicitly calls `publishProject()` and only approved projects are published.

**Verify:** Look at `src/lib/publish.ts` line 42 — the `contributionFileName()` function creates proper names. Make sure:
1. No drafts are auto-committed to GitHub
2. Only explicit curator approval triggers GitHub publish
3. File paths use the naming convention

## PROBLEM 2: Add News from Official EASER Site
**Source:** https://www.proyectoeaser.cl/noticias/ (or `/blog/`)
**News articles to fetch:**
1. "Seminario abordará los aprendizajes y desafíos de la albañilería estructural frente al riesgo sísmico" (Dec 2, 2025)
2. "Investigadores de EASER participaron en la segunda jornada del IV Congreso de Amenaza Sísmica" (Nov 15, 2025)
3. "Rosita Jünemann inauguró el IV Congreso de Amenaza Sísmica" (Nov 15, 2025)

**Action:**
- Create an API endpoint or script at `src/app/api/admin/sync-news/route.ts`
- Fetch articles from the official site (may need web scraping or API)
- Store in Firestore under `news` collection with: `title`, `description`, `date`, `link`, `source: "proyectoeaser.cl"`
- Add news display to the homepage/dashboard
- Make the endpoint accessible only to admins

## PROBLEM 3: Add Institution Logos
**Institutions (from `src/lib/constants.ts`):**
1. Universidad de Concepción (UDEC)
2. Pontificia Universidad Católica de Chile (PUC)
3. Universidad de Chile (U. de Chile)
4. SENAPRED
5. VMB Ingeniería Estructural
6. ANID

**Action:**
- Find or download official logos for each institution
- Store in `/public/logos/` as: `udec-logo.png`, `puc-logo.png`, `uchile-logo.png`, `senapred-logo.png`, `vmb-logo.png`, `anid-logo.png`
- Update `src/lib/constants.ts` to add a `logoPath` field to `INSTITUTION_ORDER`
- Update components (e.g., `src/components/project/ProjectCard.tsx`) to display logos alongside institution names
- Ensure logos are responsive and consistent in size (suggest 120px height)

**Example update to INSTITUTION_ORDER:**
```typescript
{ 
  canonical: "Universidad de Concepción", 
  short: "UDEC", 
  aliases: [...],
  logoPath: "/logos/udec-logo.png"
}
```

## DELIVERABLES
1. ✅ Verify/fix GitHub publishing (drafts don't commit; only approved projects do)
2. ✅ Create sync-news endpoint that imports articles from proyectoeaser.cl
3. ✅ Add institution logos to `/public/logos/` and integrate into UI
4. ✅ Brief explanation of changes made

**Priority:** 1 > 2 > 3 (fix publishing first, then news, then logos)

---

## NOTES
- Logos: Use official URLs or high-res downloads. If you can't find them, use placeholder approach and note in response.
- News sync: The official site is WordPress (Elementor), so you may need to scrape or check if it has an RSS feed at `/feed/` or `/blog/feed/`
- Testing: After changes, run `npm run dev` and verify:
  - Draft project does NOT appear in GitHub
  - Approved project creates a proper PR with correct file naming
  - News appears on dashboard
  - Logos render on project cards
