/**
 * Remove test/junk records (default term: "TEST1") from Firestore so they stop
 * appearing in authors, institutions, facets, and search results.
 *
 * Run where Firebase Admin credentials + network are available:
 *   npx tsx scripts/cleanup-test-data.ts            # dry run, term=TEST1
 *   npx tsx scripts/cleanup-test-data.ts TEST1 --delete
 *   npx tsx scripts/cleanup-test-data.ts "test" --delete
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.
 */
import { getAdminDb } from "../src/lib/firebase/admin";

const term = (process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "TEST1").toLowerCase();
const doDelete = process.argv.includes("--delete");

function hit(obj: any): boolean {
  const blob = JSON.stringify(obj || {}).toLowerCase();
  return blob.includes(term);
}

async function main() {
  const db = getAdminDb();
  if (!db) { console.error("No Firebase Admin credentials — cannot run."); process.exit(1); }

  const collections = ["projects", "registry", "contributions"];
  let total = 0;
  for (const col of collections) {
    const snap = await db.collection(col).get();
    const matches = snap.docs.filter((d) => hit(d.data()));
    console.log(`\n[${col}] ${matches.length} match(es) for "${term}":`);
    for (const m of matches) {
      const d: any = m.data();
      console.log(`  - ${m.id}  ${d.title || d.metadata?.title || "(untitled)"}`);
      if (doDelete) { await m.ref.delete(); total++; }
    }
  }
  console.log(doDelete ? `\nDeleted ${total} document(s).` : `\nDry run. Re-run with --delete to remove them.`);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
