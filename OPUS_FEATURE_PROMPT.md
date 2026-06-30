# OPUS TASK: Add Download, PDF Viewer, & Remove Upload Limit

**Context:** Add user-facing features to browse/download files, view PDFs in-browser, and showcase scientific papers prominently.

---

## FEATURE 1: Remove 1GB Upload Limit

**Current message:** Line 19 in `src/components/project/ProjectWizard.tsx`
```
"Maximum file size: 1 GB per file..."
```

**Action:**
1. Remove or update the 1GB limit message in ProjectWizard.tsx (lines 19 & 31)
2. Check `src/lib/storage/` providers — there shouldn't be hard validation, but verify no size checks exist
3. Update the message to: "Maximum file size: [your new limit, e.g., 5GB]. For files larger than [limit], please contact the EASER team."
4. Note: Vercel serverless functions have a 60-second timeout and 3GB max request body. For truly large files, recommend external cloud storage.

**Verify:** Test by trying to upload a 2GB test file — it should work (or fail gracefully with a better error).

---

## FEATURE 2: PDF Viewer (In-Browser Reading)

**Goal:** Display PDFs directly in the website, not require download first.

**Implementation:**
- Use a library like `react-pdf` or `pdfjs-dist` (or iframe with PDF.js)
- Recommended: `react-pdf` (easier for Next.js)

**Action:**
1. Install: `npm install react-pdf`
2. Create new component: `src/components/PDFViewer.tsx`
   - Props: `{ url: string; title?: string }`
   - Show pages, page navigation, zoom controls
   - Fallback if PDF fails to load
3. Update `src/app/projects/[id]/page.tsx`:
   - Detect "report" category files that are PDFs (check file extension)
   - Render PDFViewer for PDFs instead of just a link
   - Place PDF viewer prominently (before the "Project resources" section)

**Example in project page:**
```
[PDF Viewer showing first page of paper]
[Next/Previous buttons, "Download" link]

"Project resources" section below
```

---

## FEATURE 3: Feature Scientific Papers as Project "Face"

**Goal:** PDFs (especially reports/papers) should be the hero/face of a project.

**Changes:**
1. **Update project page layout** (`src/app/projects/[id]/page.tsx`):
   - If project has any PDFs in "report" category:
     - Display first PDF prominently at top (before summary)
     - Show PDF title/filename as a visual hero
     - Add "Explore the full project" button below the PDF viewer
   
2. **Update browse/cards** (`src/components/project/ProjectCard.tsx`):
   - Show PDF thumbnail (first page) if available
   - Highlight projects with papers differently
   - "Download" + "View" buttons on card hover

3. **Add "Explore the project" button**:
   - Button below the PDF viewer
   - Text: "Explore the full project" or "View all resources"
   - Links to the full project resources section

**Component structure:**
```
┌─────────────────────────────┐
│  PDF Viewer (Featured)       │
│  [First page of PDF]         │
│  [Page nav + Download link]  │
├─────────────────────────────┤
│ [Explore the full project]   │ ← Button
├─────────────────────────────┤
│  AI Summary / README tabs    │
├─────────────────────────────┤
│  All Project Resources       │
│  (Categorized files)         │
└─────────────────────────────┘
```

---

## FEATURE 4: Download Files

**A. Download all files as ZIP**

Create new API endpoint: `POST /api/public/projects/[id]/download`
- Response: Zipped file containing:
  - All project files (in category folders)
  - README.md
  - AI_SUMMARY.md
  - metadata.json
- Filename: `{projectSlug}_v{version}_complete.zip`
- Use library: `jszip` (npm install jszip)
- Return as `application/zip` attachment

**B. Download specific files**

Query param approach: `POST /api/public/projects/[id]/download?files=file1.pdf,file2.csv`
- Returns a ZIP with only selected files
- If only 1 file: return that file directly (don't zip)

**C. UI Integration** (in `src/app/projects/[id]/page.tsx`):
```
[PDF Viewer section]
[Buttons]:
  - Download PDF (single file)
  - Download all files as ZIP
  - Download as... (dropdown with select option)

[Resources section]
Each file category has:
  ☐ filename1.pdf
  ☐ filename2.csv
  [Select from this category]
  [Download selected]
```

**Recommendation:** Use a checkbox-based file picker modal for the "Download as..." option.

---

## FEATURE 5: Latest Uploads Section

**Goal:** Show recent projects on homepage/dashboard.

**Action:**
1. **Create API endpoint:** `GET /api/public/projects?sort=latest&limit=6`
   - Query Firestore `registry` collection ordered by `publishedAt DESC`
   - Return last 6 published projects
   - Include: title, authors, institutions, description, publishedAt

2. **Update homepage** (`src/app/page.tsx`):
   - Add "Latest uploads" section above or below existing content
   - Show 6 project cards in a grid
   - Link to `/browse` for more

3. **Alternative:** Add to `/browse` page:
   - "Latest uploads" tab alongside search
   - Shows 12-20 most recent projects

**Example section:**
```
## Latest uploads
[Project Card] [Project Card] [Project Card]
[Project Card] [Project Card] [Project Card]
[View all] → /browse
```

---

## IMPLEMENTATION ORDER

1. **Remove 1GB limit** (easiest, just messaging)
2. **Latest uploads API + UI** (straightforward query)
3. **PDF Viewer integration** (medium complexity)
4. **Feature PDFs on project page** (medium complexity)
5. **Download ZIP endpoint** (complex, but straightforward)
6. **Download UI + checkboxes** (UX, most time)

---

## TECHNICAL NOTES

**PDF Viewer:**
- `react-pdf` requires `pdfjs-dist`. May need to configure worker.
- Fallback UI if PDF fails to load.
- Performance: Large PDFs (~50MB) may be slow; consider lazy-loading.

**ZIP Downloads:**
- `jszip` library for creating ZIPs in-memory
- For very large projects (100s of MB), consider streaming (more complex).
- File size limit: Vercel response is ~3GB, but timeouts after 60s. Recommend <500MB ZIPs.

**Storage access:**
- Files are stored via `StorageProvider` (local/firebase/github).
- You must fetch files from storage and stream them to ZIP creator.
- Check `src/lib/storage/` for `get()` method.

**Database:**
- Registry records have `id`, `title`, `authors`, `publishedAt` etc.
- Query and sort by `publishedAt` for latest uploads.

---

## DELIVERABLES

✅ Remove/update 1GB limit message
✅ PDF Viewer component (`PDFViewer.tsx`)
✅ PDF integration in project page
✅ "Explore the full project" button
✅ Latest uploads API endpoint
✅ Latest uploads UI section
✅ Download all files as ZIP endpoint
✅ Download specific files endpoint
✅ Download UI with checkboxes/buttons
✅ Brief explanation of changes

---

## TESTING CHECKLIST

- [ ] Upload a 2GB file — confirm it works or fails gracefully
- [ ] View a PDF in-browser — pages load, zoom works
- [ ] Download all files as ZIP — verify contents
- [ ] Download selected files — verify correct files in ZIP
- [ ] "Latest uploads" section — shows correct projects, ordered by date
- [ ] "Explore the project" button — navigates to resources section
- [ ] Mobile view — PDF viewer responsive, buttons accessible
