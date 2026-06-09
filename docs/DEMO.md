# Tuesday Demonstration Script (~5 minutes)

**Setup (once):** `npm install && cp .env.example .env.local && npm run dev`
Optional but impressive: set `GITHUB_TOKEN` so approval opens a real PR in `easer_repository`.

## Narrative
1. **Landing page** (`/`) — "EASER is multi-institutional; GitHub stays the source of truth; this is the front door for researchers who don't use Git."
2. **Browse** (`/browse`) — click through the live repository (needs `GITHUB_TOKEN`).
3. **Contribute** (`/contribute`) — fill the 4-step wizard as a researcher:
   - Your details → About the work (note: no README writing) → optionally attach a file → Review → Submit.
   - Show the success screen + reference id + "you'll be emailed" message.
4. **Curator dashboard** (`/admin`) — the new submission appears in the queue.
5. **Review** the item:
   - **Generate draft** → a complete, structured README appears, built from the metadata.
   - **Edit** a line to show drafts are editable; **Save**.
   - **Approve & publish** → with a token, a pull request is opened in `easer_repository`; show the audit trail and the green "Published" banner with the PR link.
6. **Documentation** (`/docs`) — the approved contribution now appears in the public index.

## Talking points
- "Nothing reaches GitHub without my approval — by default it opens a pull request."
- "Storage, the AI documentation generator, and email are all swappable without touching the rest of the system."
- "It runs with zero credentials for this demo, and becomes production-ready just by filling environment variables."

## If something isn't configured
The UI degrades gracefully: browse/search show a friendly 'set GITHUB_TOKEN' note; approval explains
publishing is disabled but the rest of the workflow still works.
