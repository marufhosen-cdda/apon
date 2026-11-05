import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import { areas } from "@/lib/db/schema";
import adminData from "./data/bd-admin.json";
import { type AdminData, buildLocationTree, type LocationNode } from "./build";

/**
 * Upserts the full Bangladesh location tree into `areas`, keyed by slug.
 *
 * Idempotent and non-destructive: existing rows keep their ids (so users,
 * venues and activities stay attached) and are re-parented / renamed in
 * place. Rows that are not part of the dataset (e.g. villages an admin
 * added) are left alone. Used by `npm run db:seed` and `npm run geo:sync`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = PgDatabase<PgQueryResultHKT, any>;

const CHUNK = 500;

export async function syncLocations(db: AnyDb) {
  const nodes = buildLocationTree(adminData as unknown as AdminData);

  // Depth-first layering: every node is inserted after its parent.
  const depth = new Map<string, number>();
  for (const node of nodes) {
    depth.set(node.slug, node.parentSlug ? (depth.get(node.parentSlug) ?? 0) + 1 : 0);
  }
  const layers: LocationNode[][] = [];
  for (const node of nodes) (layers[depth.get(node.slug)!] ??= []).push(node);

  const placed = new Map<string, { id: number; ancestors: number[] }>();

  for (const layer of layers) {
    for (let i = 0; i < layer.length; i += CHUNK) {
      const chunk = layer.slice(i, i + CHUNK);
      const rows = chunk.map((node) => {
        const parent = node.parentSlug ? placed.get(node.parentSlug) : undefined;
        if (node.parentSlug && !parent)
          throw new Error(`Parent ${node.parentSlug} not placed`);
        return {
          slug: node.slug,
          nameEn: node.nameEn,
          nameBn: node.nameBn,
          level: node.level,
          parentId: parent?.id ?? null,
          ancestorIds: parent ? [...parent.ancestors, parent.id] : [],
          code: node.code,
          lat: node.lat,
          lng: node.lng,
          zone: node.zone,
          zoneLabelEn: node.zoneLabelEn,
          zoneLabelBn: node.zoneLabelBn,
        };
      });

      const inserted = await db
        .insert(areas)
        .values(rows)
        .onConflictDoUpdate({
          target: areas.slug,
          set: {
            nameEn: sql`excluded.name_en`,
            nameBn: sql`excluded.name_bn`,
            level: sql`excluded.level`,
            parentId: sql`excluded.parent_id`,
            ancestorIds: sql`excluded.ancestor_ids`,
            code: sql`excluded.code`,
            lat: sql`excluded.lat`,
            lng: sql`excluded.lng`,
            zone: sql`excluded.zone`,
            zoneLabelEn: sql`excluded.zone_label_en`,
            zoneLabelBn: sql`excluded.zone_label_bn`,
          },
        })
        .returning({ id: areas.id, slug: areas.slug, ancestorIds: areas.ancestorIds });

      for (const row of inserted)
        placed.set(row.slug, { id: row.id, ancestors: row.ancestorIds });
    }
  }

  const counts: Record<string, number> = {};
  for (const node of nodes) counts[node.level] = (counts[node.level] ?? 0) + 1;
  return {
    total: nodes.length,
    counts,
    idBySlug: new Map([...placed].map(([slug, v]) => [slug, v.id])),
  };
}
