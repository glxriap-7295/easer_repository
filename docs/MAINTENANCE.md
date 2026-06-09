# Maintenance & Sustainability

Written so a future maintainer (not the original developer) can run and extend the platform.

## Mental model
- The website is a **front door** to `easer_repository`. GitHub is the source of truth.
- Firestore holds *process* state (submissions, drafts, audit). The *content* lives in GitHub.
- Every external system is behind an interface in `src/lib/*`. To change a backend, implement the interface and register it in that folder's `index.ts` factory. Nothing else changes.

## Common maintenance tasks
| Task | Where |
|---|---|
| Add/rename a contribution category | `src/lib/constants.ts` → `CATEGORIES` |
| Change where files are committed | `.env` `GITHUB_CONTRIB_DIR` + `categoryRepoDir` |
| Switch to direct commits vs PRs | `.env` `GITHUB_WRITE_STRATEGY` |
| Add an admin/curator | `.env` `ADMIN_EMAILS` (or set an `admin` custom claim) |
| Improve documentation quality | `.env` `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` |
| Add S3/GCS storage | new `src/lib/storage/<name>.ts` implementing `StorageProvider`, register in `storage/index.ts` |
| Send real emails | `.env` `EMAIL_PROVIDER=resend` + `RESEND_API_KEY` |
| Change the documentation template | `src/lib/llm/template.ts` |

## Rotating credentials
- GitHub token: regenerate, update `GITHUB_TOKEN` in Vercel, redeploy.
- Firebase service account: generate new key, update `FIREBASE_SERVICE_ACCOUNT_JSON`.
- Use a GitHub **App** and a dedicated Firebase service account tied to the project email
  (`easer.data@gmail.com`) rather than a personal account, so access survives staff turnover.

## Health checks
- `GET /api/stats` → quick counts.
- `GET /api/repo/tree?path=` → confirms GitHub connectivity.
- Admin dashboard "Refresh" surfaces auth/connectivity errors inline.

## Backups
- GitHub is itself the durable store of published content.
- Export Firestore periodically (`gcloud firestore export`) for process/audit history.

## Known intentional limitations (future work)
- Search is path/metadata substring matching; add an index (e.g. Algolia or Firestore full-text) for large repos.
- Per-contributor profile pages (`contributors/`) are scaffolded but not yet built.
- Resumption of rejected submissions is manual (resubmit); a "revise" link could be added.
