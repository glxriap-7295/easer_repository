# EASER Platform — Developer & Maintainer Guide (RC1)

The EASER Platform is the official research management and dissemination site for
Proyecto EASER. It is a Next.js 14 (App Router) application. **Firestore is the
application index; GitHub is durable storage. Researchers never touch GitHub —
the platform does it automatically.**

## 1. Architecture at a glance
```
UI (App Router, /src/app) ─ institutional pages + repository builder + admin
API route handlers (/src/app/api) ─ thin: validate (zod) + authorize (requireRole) + call services
Services (/src/lib) ─ store, publish, docgen, storage, github, email, auth, users
Data ─ Firestore (index) + temporary upload staging; GitHub (durable contents)
```
Every external system sits behind an interface: `StorageProvider`,
`DocumentationGenerator`, `EmailProvider`, and the GitHub service. Swap
implementations behind these seams; never change the seam.

## 2. GitHub workflow (two topologies)
Selected per project via `project.repo.strategy`, with env default
`PUBLICATION_TARGET` (`folder` default; set `repo` to enable one-repo-per-project):
- **`repo`** — one independent repository per project. `ensureProjectRepo()`
  creates `easer-<slug>` (in `GITHUB_ORG` if set, else the token's account) and
  `commitToRepo()` commits README.md, AI_SUMMARY.md, metadata.json and category
  folders to its `main`.
- **`folder`** — legacy monorepo `Published Projects/<Name>/…` via `publishFiles()`
  (blobs→tree→commit, PR or direct). Preserved for backwards compatibility.
Nothing is written to GitHub until an admin **approves** a project. `src/lib/publish.ts`
is the single orchestration point (`publishProject`).

## 3. Project creation (three entry points, one backend)
- **Guided form** (`/contribute`) — the classic wizard.
- **Repository Builder** (`/contribute/build`) — visual folder tree + drag-drop.
  Only folders containing files are created; nothing hits GitHub until approval.
- **Import existing repository** (`/contribute/import`) — paste a GitHub URL;
  `readRepo()` reads the structure (read-only), generates a Scientific Overview,
  and creates a project page. The source repo is never modified.

Flow: create/build/import → files staged in Firestore (`_uploads`) → submit →
admin approves → `publishProject` (generate docs → commit → index → notify).

## 4. Scientific Overview (AI)
`src/lib/docgen/generator.ts`. Pluggable (`DOC_GENERATOR=template|ollama`,
template always available, no paid API). Produces sections: Purpose, Scientific
Context, Methods, Inputs, Outputs, Computational Tools, Applications, Limitations,
Related Research. **No-hallucination contract:** only reorganises provided facts;
unknown sections are "Not specified." Every overview carries an AI-generated note.

## 5. Resources, project types, publications
- `ProjectType` (research, computational_tool, dataset, publication, software,
  educational, field_campaign, reconnaissance) — extensible in `PROJECT_TYPES`.
- `ProjectResource` (`RESOURCE_KINDS`) — flexible, future-provider-ready links.
- `Publication` — title, authors, journal, publisher, DOI, URL, abstract,
  access (open/restricted). Prefer linking to the official publication over
  hosting publisher PDFs.

## 6. Admin
`/admin/*` is server-guarded (curator+ to view; admin for user/team/news mgmt).
- Team (`/admin/team`) — dynamic role hierarchy (`TEAM_GROUPS`): Director,
  Subdirector, Principal Investigators, Researchers, Associate Researchers,
  Postdoctoral, Graduate Students & Research Assistants, Other Contributors.
- News/Novedades (`/admin/news`) — CMS + "Sync official news".
- Users (`/admin/users`) — roles & activation.

## 7. Environment variables
See `.env.example`. Key ones:
- Firebase: `FIREBASE_SERVICE_ACCOUNT_JSON` (server), `NEXT_PUBLIC_FIREBASE_*`.
- GitHub: `GITHUB_TOKEN`; `GITHUB_ORG` (optional, repo strategy target);
  `GITHUB_REPO_PREFIX` (default `easer-`); `GITHUB_OWNER/REPO/DEFAULT_BRANCH`
  (folder strategy); `PUBLICATION_TARGET` (`folder`|`repo`).
- Storage: `STORAGE_PROVIDER` (`firestore` default — draft staging; never commits
  to GitHub before approval); `MAX_UPLOAD_MB`.
- AI: `DOC_GENERATOR`, `OLLAMA_URL`, `OLLAMA_MODEL`.
- Email: `EMAIL_PROVIDER`, `RESEND_API_KEY`/SMTP.
- `ADMIN_EMAILS`, `NEXT_PUBLIC_GITHUB_ORG_URL`.

## 8. Firestore rules
Production rules in `firestore.rules`: public read of published content
(registry, team, news, contributors); users read own doc; everything else and
ALL writes are denied to clients — mutations happen only through authenticated
API routes using the Admin SDK. Deploy: `firebase deploy --only firestore:rules`.

## 9. Deployment
Vercel. Set env vars, deploy `firestore.rules`, enable Email/Password in Firebase
Auth. Public read API routes are `force-dynamic` (do not remove — otherwise
Next caches them at build time and public pages show stale/empty data).

## 10. Conventions for maintainers
Keep API routes thin; put logic in `lib/` services. All public read routes:
`export const dynamic = "force-dynamic"`. Never write to Firestore from the
browser. Add a new storage/AI/email backend by implementing its interface and
registering it in the factory — no other change required.
