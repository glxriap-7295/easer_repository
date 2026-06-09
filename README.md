# EASER Research Data Hub

A GitHub-centric platform that lets researchers contribute to the **EASER** repository through a professional web interface — **without using Git**. GitHub (`easer_repository`) remains the single source of truth; this hub is the curated submission, documentation, and review layer in front of it.

> EASER is a multi-institutional research initiative (Universidad de Chile, SENAPRED, ANID, and partners). The repository holds computational models, scientific datasets, GIS/spatial data, reports, documentation, scripts, and technical resources.

## What it does

* **Landing page** explaining the project and how to contribute.
* **Browse** the GitHub repository contents in the browser.
* **Search** published contributions and repository files.
* **Contribution wizard** — a guided form (no Git, no README writing required).
* **Automatic documentation** generated from researcher-provided metadata (editable).
* **Curator dashboard** with a review queue, approval/rejection, and an audit trail.
* **GitHub publishing** on approval (pull request by default — nothing auto-commits).
* **Email notifications** to contributors and curators.
* Mobile-friendly, academic visual design.

## Workflow

```text
Researcher → Submission → Metadata → Doc draft → Review queue → Admin approval → GitHub (PR/commit)
```

## Tech

Next.js 14 (App Router, TypeScript) · Vercel · Firebase (Firestore + Auth) · GitHub REST API (Octokit) · pluggable Storage / LLM / Email providers · Tailwind CSS.

## Quick start (zero credentials)

```bash
npm install
cp .env.example .env.local
npm run dev
```

The full workflow runs locally with an in-memory store, offline template doc generation, and a console email provider. Add `GITHUB_TOKEN` and Firebase keys to enable live publishing and persistence.

## Documentation

* `docs/ARCHITECTURE.md` — system design and decisions.
* `docs/DESIGN_REVIEW.md` — multi-role internal review.
* `docs/DATA_MODEL.md` — Firestore collections and repository layout.
* `docs/SETUP.md` — local setup.
* `docs/DEPLOYMENT.md` — Vercel + Firebase + GitHub deployment.
* `docs/MAINTENANCE.md` — operations and future maintenance.
* `docs/DEMO.md` — demonstration workflow.

## Project Facts

* GitHub repository: https://github.com/glxriap-7295/easer_repository
* Firebase project: `easer-521eb`
* Project email: `easer