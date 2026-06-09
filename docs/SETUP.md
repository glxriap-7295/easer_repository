# Local Setup

## Prerequisites
- Node.js 18.18+ (or 20+)
- npm

## 1. Install
```bash
npm install
```

## 2. Environment
```bash
cp .env.example .env.local
```
For a **zero-credential demo**, leave everything as-is and skip to step 3 — the app runs with an
in-memory database, the offline `template` documentation generator, and a console email provider.

To enable real features, fill in:
- `GITHUB_TOKEN` → enables Browse, Search of repo files, and Publishing. Use a fine-grained PAT with **Contents: Read & Write** (and **Pull requests: Read & Write** if `GITHUB_WRITE_STRATEGY=pull_request`) on `easer_repository`.
- Firebase client keys (`NEXT_PUBLIC_FIREBASE_*`) → enables curator sign-in.
- `FIREBASE_SERVICE_ACCOUNT_JSON` → enables persistent Firestore storage.
- `ANTHROPIC_API_KEY` + `LLM_PROVIDER=anthropic` → higher-quality documentation drafts.
- `RESEND_API_KEY` + `EMAIL_PROVIDER=resend` (or SMTP vars) → real emails.

## 3. Run
```bash
npm run dev
# http://localhost:3000
```

## 4. Demo the workflow (no credentials needed)
1. Go to **/contribute**, complete the 4-step wizard, submit.
2. Go to **/admin** (dev mode grants curator access automatically).
3. Open the contribution → **Generate draft** → review/edit → **Approve**.
   - Without `GITHUB_TOKEN`, approval reports that publishing is disabled; everything else works.
   - With `GITHUB_TOKEN`, a PR (or commit) is created in `easer_repository`.

## Useful scripts
```bash
npm run dev        # local dev server
npm run build      # production build
npm run typecheck  # TypeScript check
npm run seed       # insert sample contributions (in-memory or Firestore)
```
