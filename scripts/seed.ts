/**
 * Seed sample contributions so the dashboard and demo are populated.
 * Run: npm run seed
 * Works against Firestore if FIREBASE_SERVICE_ACCOUNT_JSON is set, otherwise
 * prints what it would insert (the in-memory store is per-request in the app,
 * so for live demos prefer submitting through the UI).
 */
import { createContribution } from "../src/lib/store";
import { newId } from "../src/lib/api";
import type { Contribution } from "../src/lib/types";

const now = new Date().toISOString();

const samples: Omit<Contribution, "id">[] = [
  {
    status: "metadata_complete",
    submitter: { name: "María González", email: "mgonzalez@uchile.cl", affiliation: "Universidad de Chile", orcid: "0000-0002-1825-0097" },
    metadata: {
      title: "Seismic hazard model for central Chile",
      category: "model",
      description: "A probabilistic seismic hazard model covering the central Chile subduction zone.",
      purpose: "Estimate peak ground acceleration for infrastructure risk assessment.",
      dependencies: "Python 3.11, numpy, openquake",
      requirements: "8 GB RAM",
      installation: "pip install -r requirements.txt",
      execution: "python run_model.py --region central",
      inputFiles: "fault_catalog.csv, site_grid.geojson",
      outputFiles: "pga_map.tif",
      notes: "Calibrated against 2010 Maule event.",
      keywords: ["seismic", "hazard", "PGA", "Chile"],
      license: "CC-BY-4.0"
    },
    files: [],
    audit: [{ at: now, actor: "mgonzalez@uchile.cl", action: "submitted" }],
    createdAt: now, updatedAt: now
  },
  {
    status: "metadata_complete",
    submitter: { name: "SENAPRED Data Team", email: "datos@senapred.cl", affiliation: "SENAPRED" },
    metadata: {
      title: "National flood exposure dataset 2024",
      category: "dataset",
      description: "Building-level flood exposure indicators for major Chilean watersheds.",
      purpose: "Support emergency planning and exposure analysis.",
      keywords: ["flood", "exposure", "GIS", "emergency"],
      license: "CC-BY-4.0"
    },
    files: [],
    audit: [{ at: now, actor: "datos@senapred.cl", action: "submitted" }],
    createdAt: now, updatedAt: now
  }
];

async function main() {
  for (const s of samples) {
    const c: Contribution = { id: newId(), ...s };
    await createContribution(c);
    console.log("seeded:", c.id, "-", c.metadata.title);
  }
  console.log("done.");
}
main().catch((e) => { console.error(e); process.exit(1); });
