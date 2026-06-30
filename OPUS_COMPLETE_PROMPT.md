# OPUS COMPLETE TASK: Full Feature & Bug Fix Bundle

**Context:** You're working on EASER's personal deployment. This is an all-in-one prompt covering: GitHub publishing fixes, news integration, institution logos, upload limit removal, PDF viewing, file downloads, and latest uploads display.

---

## PRIORITY 1: Fix Critical GitHub Publishing Issue

### Problem
Files/drafts are being saved to GitHub with incorrect folder structure and naming. Only approved projects should publish.

### Fix Location
Check `src/app/api/projects/[id]/approve/route.ts` — ensure approval explicitly calls `publishProject()` and ONLY approved projects are published.

### Verify in `src/lib/publish.ts` (line 42)
The `contributionFileName()` function creates proper names. Make sure:
1. **No drafts auto-commit to GitHub** — drafts stay in "draft" status only
2. **Only explicit curator approval triggers GitHub publish**
3. **File paths use naming convention:** `{projectSlug}_{authorInitials}_{filename}`
   - Example: `tsunami-hazard-study_jd_report.pdf`
4. **Folder structure:** `/Published Projects/{ProjectTitle}/{FileCategory}/{namedfile}`

---

## PRIORITY 2: Remove 1GB Upload Limit

### Current message
Lines 19 & 31 in `src/components/project/ProjectWizard.tsx`

### Action
1. Update/remove the 1GB limit message
2. Verify no hard validation in `src/lib/storage/` providers
3. New message: "Maximum file size: [new limit, e.g., 5GB]. For larger files, please contact the EASER team."
4. **Note:** Vercel serverless has 60s timeout and 3GB max request body — for truly large uploads, document external storage option

### Test
Try uploading a 2GB file — should work or fail gracefully with helpful error

---

## PRIORITY 3: Add News from Official EASER Site

### Source
https://www.proyectoeaser.cl/noticias/ (or `/blog/`)

### News Articles to Fetch
1. "Seminario abordará los aprendizajes y desafíos de la albañilería estructural frente al riesgo sísmico" (Dec 2, 2025)
2. "Investigadores de EASER participaron en la segunda jornada del IV Congreso de Amenaza Sísmica" (Nov 15, 2025)
3. "Rosita Jünemann inauguró el IV Congreso de Amenaza Sísmica" (Nov 15, 2025)

### Implementation

**A. Create admin sync endpoint:** `src/app/api/admin/sync-news/route.ts`
- Admin-only (check user role)
- Fetches from proyectoeaser.cl (use web scraping or RSS if available)
- Stores in Firestore `news` collection with: `title`, `slug`, `description`, `date`, `link`, `source: "proyectoeaser.cl"`, `imageUrl` (optional)
- Returns success/failure

**B. Update news routes** in `src/app/api/admin/news/`:
- Already exists (based on glob results), so integrate with existing structure
- Ensure sync endpoint stores data in the same schema

**C. Display news on homepage** (`src/app/page.tsx`):
- Add "Latest news" section showing 3-5 most recent news items
- Each item shows: title, date, description snippet, "Read more" link
- If article is from proyectoeaser.cl, show external icon

**D. Create public news page** (optional):
- `src/app/news/page.tsx` — full news listing
- `/news/[slug]` — individual article (can redirect to proyectoeaser.cl or display copy)

---

## PRIORITY 4: Add Institution Logos

### Institutions
From `src/lib/constants.ts` INSTITUTION_ORDER:
1. Universidad de Concepción (UDEC)
2. Pontificia Universidad Católica de Chile (PUC)
3. Universidad de Chile (U. de Chile)
4. SENAPRED
5. VMB Ingeniería Estructural
6. ANID

### Implementation

**A. Download/source logos**
- Find official logos for each institution
- Store in `/public/logos/` as:
  - `udec-logo.png`, `puc-logo.png`, `uchile-logo.png`, `senapred-logo.png`, `vmb-logo.png`, `anid-logo.png`
- Ensure high resolution (suggest 500px+ width)

**B. Update constants**
Add `logoPath` field to INSTITUTION_ORDER in `src/lib/constants.ts`:
```typescript
{ 
  canonical: "Universidad de Concepción", 
  short: "UDEC", 
  aliases: [...],
  logoPath: "/logos/udec-logo.png"
}
```

**C. Update UI components**
- `src/components/project/ProjectCard.tsx` — show institution logo alongside name
- `src/app/projects/[id]/page.tsx` — display logos in institution section
- Ensure logos are responsive (max height 80px on cards, 100px on project page)

**D. Create institution cards** (optional):
- Add an "Institutions" page showing all partner logos and links

---

## PRIORITY 5: PDF Viewer & Feature Papers

### A. Install PDF viewer
`npm install react-pdf`

### B. Create PDF Viewer component
`src/components/PDFViewer.tsx`
- Props: `{ url: string; title?: string; fileName?: string }`
- Features:
  - Display first page by default
  - Page navigation (Next/Previous buttons)
  - Zoom in/out controls
  - "Download" link
  - Show current page / total pages
  - Fallback UI if PDF fails to load

### C. Update project page (`src/app/projects/[id]/page.tsx`)
**New layout:**
```
┌─────────────────────────────────┐
│  FEATURED PDF SECTION           │
│  [PDF Viewer - First page]      │
│  [Page nav + Download link]     │
│  [Explore the full project btn] │ ← New button
├─────────────────────────────────┤
│  AI Summary / README tabs       │
├─────────────────────────────────┤
│  Project Resources (categorized)│
└─────────────────────────────────┘
```

**Logic:**
- If project has any PDFs in "report" category:
  - Display first PDF prominently at top
  - Show PDF filename as visual indicator
  - Add "Explore the full project" button (scrolls to resources section)
- If no PDFs, show summary as before

### D. Update browse cards
`src/components/project/ProjectCard.tsx`
- Show PDF thumbnail (first page) if available
- Highlight projects with papers with a "Has PDFs" badge
- Add "View" button to open PDF viewer

---

## PRIORITY 6: Download Files Functionality

### A. Create download endpoints

**Endpoint 1: Download all files as ZIP**
`POST /api/public/projects/[id]/download`
- Returns: ZIP file containing:
  - All project files (organized in category folders)
  - README.md
  - AI_SUMMARY.md
  - metadata.json
- Filename: `{projectSlug}_v{version}_complete.zip`
- Use: `jszip` library (`npm install jszip`)
- Response: `application/zip` with attachment header

**Endpoint 2: Download specific files**
`POST /api/public/projects/[id]/download` with query params
- Query: `?files=filename1.pdf,filename2.csv`
- Returns: ZIP with only selected files
- If only 1 file selected: return that file directly (no ZIP)

**Libraries needed:**
- `jszip` — create ZIP files in-memory
- Use `StorageProvider.get()` to fetch files (see `src/lib/storage/`)

**Considerations:**
- Vercel max response: ~3GB, max timeout 60s
- Large projects (>500MB): warn user or implement streaming
- Cache friendly: allow multiple downloads of same project

### B. Update project page UI (`src/app/projects/[id]/page.tsx`)

Add download section in sidebar or header:
```
[Download options]
├─ Download PDF (if featured PDF)
├─ Download all files as ZIP
└─ Download selected files...

[Resources section - add checkboxes]
Each file category:
  ☐ filename1.pdf
  ☐ filename2.csv
  ...
[Select from category]
[Download selected] button
```

### C. Create download modal/UI
- Checkbox-based file picker for "Download selected files"
- Show file sizes, total download size
- Friendly file tree view (grouped by category)

---

## PRIORITY 7: Latest Uploads Section

### A. Create API endpoint
`GET /api/public/projects?sort=latest&limit=6`
- Query Firestore `registry` collection
- Order by `publishedAt DESC`
- Return last 6 published projects
- Fields: `id`, `title`, `authors`, `institutions`, `description`, `publishedAt`, (optional: first PDF thumbnail)

### B. Update homepage (`src/app/page.tsx`)
Add "Latest uploads" section:
```
## Latest uploads
[Project Card] [Project Card] [Project Card]
[Project Card] [Project Card] [Project Card]
[View all →] link to /browse
```

### C. Alternative: Add to browse page
- Add "Latest uploads" tab in `/browse`
- Shows 12-20 most recent projects
- Sort toggle: Latest / Popular / Alphabetical

---

## IMPLEMENTATION ORDER (Suggested)

1. **Fix GitHub publishing** (critical)
2. **Remove 1GB limit** (quick fix)
3. **Add institution logos** (straightforward)
4. **Add news sync endpoint** (API work)
5. **Display news on homepage** (UI integration)
6. **PDF Viewer component** (medium complexity)
7. **Feature PDFs on project page** (UI layout)
8. **Latest uploads API + UI** (data + display)
9. **Download endpoints** (API complexity)
10. **Download UI + checkboxes** (UX polish)

---

## TECHNICAL NOTES

**PDF Viewer:**
- `react-pdf` requires `pdfjs-dist` worker configuration
- For Next.js App Router, may need to configure public worker file
- Fallback UI if PDF fails to load
- Performance: Very large PDFs (~100MB) may be slow; consider lazy loading

**ZIP Downloads:**
- `jszip` creates ZIPs in-memory (not disk)
- Streaming approach for large files is more complex
- Test with various file sizes and types

**Storage Access:**
- Files are fetched via `StorageProvider.get(storageKey)`
- Check `src/lib/storage/index.ts` for factory pattern
- Different providers (local/firebase/github) — same interface

**News Integration:**
- Official site is WordPress/Elementor
- Check if RSS available at `/feed/` or use web scraping
- Store in Firestore for performance (don't scrape on every request)

**Database:**
- Firestore collections: `registry`, `news`, `projects`
- Registry includes `publishedAt` for sorting
- Add indexes if querying gets slow

---

## DELIVERABLES

✅ GitHub publishing fix verified
✅ 1GB limit removed/updated
✅ Institution logos added to `/public/logos/`
✅ Institution logos integrated into UI
✅ News sync endpoint (`sync-news/route.ts`)
✅ News displayed on homepage
✅ PDF Viewer component (`PDFViewer.tsx`)
✅ PDFs featured on project page
✅ "Explore the full project" button added
✅ Latest uploads API endpoint
✅ Latest uploads UI section
✅ Download all files as ZIP endpoint
✅ Download specific files endpoint
✅ Download UI with checkboxes
✅ Brief explanation of all changes

---

## TESTING CHECKLIST

- [ ] Draft project does NOT appear in GitHub
- [ ] Approved project creates proper PR with correct file naming
- [ ] Upload 2GB+ file — works or fails gracefully
- [ ] News section displays on homepage
- [ ] Institution logos render correctly in project cards and project page
- [ ] PDF viewer opens in-browser, pages load, zoom works
- [ ] "Explore the full project" button scrolls to resources
- [ ] Download all files as ZIP — verify contents, file structure
- [ ] Download selected files — only chosen files in ZIP
- [ ] Latest uploads section shows correct projects, ordered by date
- [ ] Mobile view — all features responsive and accessible

---

## NOTES FOR OPUS

This is a substantial feature bundle. Break it into logical PR-sized chunks:
- PR #1: Fix GitHub publishing + remove upload limit
- PR #2: Add institution logos + news sync
- PR #3: PDF viewer + feature papers
- PR #4: Download functionality
- PR #5: Latest uploads section

Each should be independently testable and deployable.
