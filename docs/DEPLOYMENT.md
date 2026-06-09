# Deployment (Vercel + Firebase + GitHub)

## A. GitHub access token
1. GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate.
2. Resource owner: the account/org owning `easer_repository`. Repository access: only `easer_repository`.
3. Permissions: **Contents: Read & Write**, **Pull requests: Read & Write**, **Metadata: Read**.
4. Copy the token → it becomes `GITHUB_TOKEN`.

> Prefer a **GitHub App** long-term (installation tokens auto-rotate, survive staff changes). The code uses a bearer token, so an App installation token is a drop-in replacement.

## B. Firebase
1. Firebase console → project `easer-521eb` → Project settings → **Your apps** (Web) → copy the config into the `NEXT_PUBLIC_FIREBASE_*` vars.
2. Authentication → enable **Google** (and Email/Password if desired). Add your domain to authorized domains.
3. Service account → **Generate new private key** → paste the JSON (single line) into `FIREBASE_SERVICE_ACCOUNT_JSON`.
4. Deploy security rules:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,firestore:indexes
   ```

## C. Vercel
1. The repo is already connected. Push this project to its branch.
2. Vercel → Project → Settings → **Environment Variables**: add everything from `.env.example`
   (without quotes; `FIREBASE_SERVICE_ACCOUNT_JSON` as one line). Set for Production + Preview.
3. Set `NEXT_PUBLIC_SITE_URL` to the deployed URL.
4. Redeploy. Vercel auto-builds on push (`next build`).

## D. Verify
- `/` loads; `/browse` lists repo contents; `/contribute` submits; `/admin` requires an allowlisted curator in production; approval opens a PR in `easer_repository`.

## Environment variable summary
See `.env.example` — every variable is documented inline. Server-only secrets
(`GITHUB_TOKEN`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`,
`SMTP_PASS`) must **not** use the `NEXT_PUBLIC_` prefix.
