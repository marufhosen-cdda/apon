import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";
import { syncLocations } from "@/lib/geo/sync";

/**
 * `npm run geo:sync` — load/refresh the nationwide location tree without
 * touching any other data. Safe to run against production: rows are upserted
 * by slug, so existing users/venues/activities keep their location.
 */
async function main() {
  const client = postgres(env.DATABASE_URL, { max: 1, prepare: false });
  const db = drizzle(client, { schema });
  const started = Date.now();
  const result = await syncLocations(db);
  console.log(
    `Synced ${result.total} locations in ${Date.now() - started}ms`,
    result.counts,
  );
  await client.end();
}

main().catch((err) => {
  console.error("Location sync failed:", err);
  process.exit(1);
});
