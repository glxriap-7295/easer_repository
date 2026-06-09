# EASER Research Data Hub — Architecture

## 1. Goal & guiding constraint
A professional web interface that lets non-technical researchers contribute to the EASER
repository **without using Git**, while **GitHub remains the single source of truth**. The
platform never replaces GitHub; it sits in front of it as a curated submission and
documentation layer.

## 2. Stack (dictated by existing infrastructure)
| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 14 (App Router) + TypeScript** | One codebase for UI + API; first-class on Vercel (already connected). |
| Hosting | **Vercel** | Already wired to the GitHub repo; serverless functions for the API. |
| Database | **Firebase Firestore** (Admin SDK server-side) | Already enabled. Stores the contribution registry, audit log, public registry. |
| Auth | **Firebase Auth** (Google + email) | Same project; curator-only dashboard via an admin email allowlist. |
| Repo I/O | **GitHub REST API via Octokit** | No local git clone needed — works in serverless. Reads tree/files; writes via Git Data API. |
| Doc generation | **Pluggable LLM provider** (`template` default, `anthropic` optional) | Template works offline with zero keys; Anthropic upgrades prose quality. |
| Storage | **Pluggable StorageProvider** (`local`, `firebase`, extensible to S3/GCS) | Requirement: storage must be swappable without redesign. |
| Email | **Pluggable EmailProvider** (`console`, `resend`, SMTP-ready) | Console works keyless for the demo; Resend for production. |

## 3. Module boundaries (`src/lib`)
Everything that touches an external system is behind an interface so it can be swapped:
- `storage/` — `StorageProvider` interface + `local` / `firebase` implementations + factory.
- `llm/` — `DocProvider` interface + `template` / `anthropic` + factory.
- `email/` — `EmailProvider` interface + `console` / `resend` + factory.
- `github/service.ts` — all GitHub reads/writes (tree, file, publish via blobs→tree→commit→PR).
- `store.ts` — Firestore data access with an **in-memory fallback** so the entire workflow runs with no credentials (critical for the Tuesday demo).
- `auth.ts` — Firebase ID-token verification + admin allowlist (+ dev bypass).
- `docgen/generate.ts` — orchestrates metadata → documentation draft.

This is the answer to "maintainable after the original developer leaves": new backends are added
by implementing one interface and registering it in one factory; no call sites change.

## 4. Data flow (the core workflow)
```
Researcher (web form)
  → POST /api/contributions            (validated by zod; status: metadata_complete)
  → admin: POST /api/contributions/:id/generate-docs   (DocProvider → draft; status: in_review)
  → admin edits draft: PATCH /api/contributions/:id
  → admin: POST /api/contributions/:id/approve
        → github.publishFiles()  (README + small attachments)
        → strategy = pull_request (default) or commit
        → registry upserted; email to contributor; status: approved/published
  (or) admin: POST /api/contributions/:id/reject   (email to contributor; status: rejected)
```
**Nothing reaches GitHub without an explicit admin approval action.**

## 5. GitHub write strategy
`GITHUB_WRITE_STRATEGY` selects:
- `pull_request` (default, safest): creates a branch + PR so the curator gives a final confirmation on GitHub itself.
- `commit`: fast-forwards `main` directly (use only when the in-app review is considered authoritative).

Writes use the Git Data API (create blobs → tree → commit → ref/PR) so multiple files land as one atomic change, and no local checkout is needed in the serverless runtime.

## 6. Storage policy
Files ≤ 5 MB are committed alongside the README. Larger files stay in the external
`StorageProvider` and are linked from the documentation — keeping the git history lean and
honoring the "large files may need external storage" requirement without coupling to any one backend.

## 7. Data model (Firestore)
- `contributions/{id}` — full lifecycle record (submitter, metadata, files, draft, audit, status, github links).
- `registry/{id}` — denormalized, public, read-only record per published contribution (powers Docs + Search).
- `audit/{id}` — append-only action log (also embedded per-contribution).
- `contributors/{id}` — researcher records (future contributor pages).

See `DATA_MODEL.md` for field-level detail.

## 8. Security
- Client Firestore rules are conservative; all state-changing writes go through API routes using the Admin SDK (which bypasses rules) after `requireAdmin`.
- Secrets (`GITHUB_TOKEN`, service account, API keys) are server-only env vars; never shipped to the browser.
- Admin access = Firebase Auth user whose email is in `ADMIN_EMAILS` (or has an `admin` custom claim).

## 9. Degraded / demo mode
With no credentials at all the app still runs end-to-end: in-memory store, template docgen,
console email. Browsing/search/publish to GitHub activate as soon as `GITHUB_TOKEN` is set;
persistence activates as soon as Firebase Admin credentials are set. This separation lets the
Tuesday demo run locally with zero setup while production is a matter of filling env vars.
