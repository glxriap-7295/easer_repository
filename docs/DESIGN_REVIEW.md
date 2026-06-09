# Internal Design Review

A short multi-role critique of the first design, and how the implementation responds.

## Senior Data Engineer
**Risks raised**
- Coupling to Firebase Storage would make future migration to S3/GCS painful.
- Committing large scientific datasets/GIS rasters into Git would bloat history irreversibly.
- No durable record of *who approved what, when*.

**Resolutions**
- Storage is behind a `StorageProvider` interface; Firebase is just one implementation.
- 5 MB inline-commit threshold; larger artifacts stay external and are linked.
- Append-only `audit` collection + per-contribution audit trail surfaced in the UI.

## Research Software Engineer
**Risks raised**
- Serverless can't run `git` against a clone — naive "commit" designs break on Vercel.
- A hard dependency on an LLM key would make the demo fragile and add cost/latency.
- Auto-committing to `main` is dangerous for an official, multi-institution repo.

**Resolutions**
- GitHub writes use the REST Git Data API (blobs→tree→commit), no working copy needed.
- `template` doc generator is the default and fully offline; Anthropic is opt-in and falls back gracefully.
- Default write strategy is **pull request**, so a human confirms on GitHub before merge.

## UX Designer
**Risks raised**
- Researchers abandon long forms; "README" is intimidating jargon.
- Error states (no GitHub token, upload failure) must not dead-end the user.
- Must be usable on a phone.

**Resolutions**
- 4-step wizard with progress indicator; the word "README" never appears for submitters — they answer plain questions and the platform writes the document.
- Upload failures are non-blocking ("you can still submit; the curator will request files").
- Tailwind responsive layout; mobile nav; tested at narrow widths.

## Academic Data Manager
**Risks raised**
- Provenance, affiliation, ORCID, licensing and contact must be first-class, not afterthoughts.
- Sustainability: the tool must outlive the original student developer.
- Contributors need acknowledgement / a record of their contributions.

**Resolutions**
- Metadata schema captures author, affiliation, ORCID, license, keywords, purpose, and contact; the generated README enforces a consistent academic structure.
- Plain-interface architecture, exhaustive docs (`SETUP`, `DEPLOYMENT`, `MAINTENANCE`), pluggable providers, and human-editable `constants.ts` for categories — a successor can operate and extend it without reverse-engineering.
- Public registry + Documentation index credit each contributor; future `contributors/` pages are scaffolded.

## Net changes adopted
1. Storage/LLM/email all abstracted behind interfaces + factories.
2. In-memory + console + template fallbacks so the demo needs zero credentials.
3. Pull-request-by-default GitHub publishing.
4. Audit trail end-to-end.
5. Submitter-facing language stripped of Git/README jargon.
