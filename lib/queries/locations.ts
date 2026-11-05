import "server-only";

import { type AnyColumn, and, asc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { cache } from "react";

import { ActionError } from "@/lib/actions/action";
import { db } from "@/lib/db";
import { areas } from "@/lib/db/schema";
import {
  type LocationCrumb,
  type LocationLevel,
  type LocationOption,
  type LocationSearchResult,
  LOCATION_LEVELS,
} from "@/lib/geo/levels";

/** Sort city corporations before upazilas, thanas before wards, etc. */
const levelOrder = sql`array_position(array[${sql.join(
  LOCATION_LEVELS.map((l) => sql`${l}`),
  sql`, `,
)}]::text[], ${areas.level})`;

/** Wards sort numerically ("Ward 2" before "Ward 10"). */
const naturalName = sql`coalesce(nullif(regexp_replace(${areas.nameEn}, '\\D', '', 'g'), '')::int, 0)`;

const childCount = sql<number>`(
  select count(*)::int from areas c where c.parent_id = ${areas.id} and c.is_active
)`;

const optionColumns = {
  id: areas.id,
  slug: areas.slug,
  level: areas.level,
  nameEn: areas.nameEn,
  nameBn: areas.nameBn,
  childCount,
};

/** Direct children of a node (or the eight divisions when `parentId` is null). */
export const getLocationChildren = cache(
  async (parentId: number | null): Promise<LocationOption[]> => {
    const rows = await db
      .select(optionColumns)
      .from(areas)
      .where(
        and(
          parentId === null ? isNull(areas.parentId) : eq(areas.parentId, parentId),
          eq(areas.isActive, true),
        ),
      )
      .orderBy(
        levelOrder,
        sql`case when ${areas.level} = 'ward' then ${naturalName} else 0 end`,
        asc(areas.nameEn),
      );
    return rows as LocationOption[];
  },
);

/** Root-first trail including the node itself. */
export const getLocationTrail = cache(
  async (id: number | null | undefined): Promise<LocationCrumb[]> => {
    if (!id) return [];
    const [node] = await db
      .select({ id: areas.id, ancestorIds: areas.ancestorIds })
      .from(areas)
      .where(eq(areas.id, id))
      .limit(1);
    if (!node) return [];
    const ids = [...node.ancestorIds, node.id];
    const rows = await db
      .select({
        id: areas.id,
        slug: areas.slug,
        level: areas.level,
        nameEn: areas.nameEn,
        nameBn: areas.nameBn,
      })
      .from(areas)
      .where(inArray(areas.id, ids));
    const byId = new Map(rows.map((r) => [r.id, r]));
    return ids.map((i) => byId.get(i)).filter(Boolean) as LocationCrumb[];
  },
);

/** Trails for many nodes at once (admin tables, venue lists). */
export async function getLocationTrails(
  ids: (number | null | undefined)[],
): Promise<Map<number, LocationCrumb[]>> {
  const wanted = [...new Set(ids.filter((id): id is number => typeof id === "number"))];
  if (wanted.length === 0) return new Map();
  const nodes = await db
    .select({ id: areas.id, ancestorIds: areas.ancestorIds })
    .from(areas)
    .where(inArray(areas.id, wanted));
  const all = [...new Set(nodes.flatMap((n) => [...n.ancestorIds, n.id]))];
  const rows = await db
    .select({
      id: areas.id,
      slug: areas.slug,
      level: areas.level,
      nameEn: areas.nameEn,
      nameBn: areas.nameBn,
    })
    .from(areas)
    .where(inArray(areas.id, all));
  const byId = new Map(rows.map((r) => [r.id, r as LocationCrumb]));
  return new Map(
    nodes.map((n) => [
      n.id,
      [...n.ancestorIds, n.id]
        .map((i) => byId.get(i))
        .filter((c): c is LocationCrumb => Boolean(c)),
    ]),
  );
}

export const getLocationBySlug = cache(async (slug: string) => {
  const rows = await db.select().from(areas).where(eq(areas.slug, slug)).limit(1);
  return rows[0] ?? null;
});

/**
 * Name search across the whole tree (English or Bangla, prefix matches first).
 * Returns each hit with its ancestor trail so "Sadar" results are distinguishable.
 */
export async function searchLocations(
  query: string,
  limit = 12,
): Promise<LocationSearchResult[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const prefix = `${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;

  const hits = await db
    .select({ ...optionColumns, ancestorIds: areas.ancestorIds })
    .from(areas)
    .where(
      and(
        eq(areas.isActive, true),
        sql`${areas.level} <> 'ward'`,
        or(sql`lower(${areas.nameEn}) like ${like}`, sql`${areas.nameBn} like ${like}`),
      ),
    )
    .orderBy(
      sql`case when lower(${areas.nameEn}) like ${prefix} or ${areas.nameBn} like ${prefix} then 0 else 1 end`,
      levelOrder,
      asc(areas.nameEn),
    )
    .limit(limit);

  const ancestorIds = [...new Set(hits.flatMap((h) => h.ancestorIds))];
  const ancestors = ancestorIds.length
    ? await db
        .select({
          id: areas.id,
          slug: areas.slug,
          level: areas.level,
          nameEn: areas.nameEn,
          nameBn: areas.nameBn,
        })
        .from(areas)
        .where(inArray(areas.id, ancestorIds))
    : [];
  const byId = new Map(ancestors.map((a) => [a.id, a as LocationCrumb]));

  return hits.map(({ ancestorIds: ids, ...hit }) => ({
    ...(hit as LocationOption),
    trail: [
      ...ids.map((id) => byId.get(id)).filter((c): c is LocationCrumb => Boolean(c)),
      {
        id: hit.id,
        slug: hit.slug,
        level: hit.level as LocationLevel,
        nameEn: hit.nameEn,
        nameBn: hit.nameBn,
      },
    ],
  }));
}

/** SQL predicate: `column` points at `locationId` or anything inside it. */
export function withinLocation(column: AnyColumn, locationId: number) {
  return sql`${column} in (select l.id from areas l where l.id = ${locationId} or ${locationId} = any(l.ancestor_ids))`;
}

/** Counts per level, for the admin locations overview. */
export async function getLocationLevelCounts() {
  const rows = await db
    .select({ level: areas.level, count: sql<number>`count(*)::int` })
    .from(areas)
    .groupBy(areas.level);
  return Object.fromEntries(rows.map((r) => [r.level, r.count])) as Partial<
    Record<LocationLevel, number>
  >;
}

/**
 * Validates a location a member wants to save as "where I live".
 * Throws the translation key the action wrapper hands back to the UI.
 */
export async function assertSelectableLocation(id: number) {
  const [row] = await db
    .select({ id: areas.id, level: areas.level, isActive: areas.isActive })
    .from(areas)
    .where(eq(areas.id, id))
    .limit(1);
  if (!row || !row.isActive || row.level === "division") {
    throw new ActionError("locations.pickMoreSpecific");
  }
  return row;
}

export type AdminLocationRow = {
  id: number;
  slug: string;
  level: LocationLevel;
  nameEn: string;
  nameBn: string;
  isActive: boolean;
  zoneLabelEn: string;
  childCount: number;
  members: number;
  venues: number;
};

/** Children of `parentId` with subtree member/venue counts (admin browser). */
export async function getAdminLocationRows(parentId: number | null): Promise<AdminLocationRow[]> {
  const parentFilter = parentId === null ? sql`c.parent_id is null` : sql`c.parent_id = ${parentId}`;
  const rows = await db.execute<AdminLocationRow>(sql`
    select
      c.id, c.slug, c.level, c.name_en as "nameEn", c.name_bn as "nameBn",
      c.is_active as "isActive", c.zone_label_en as "zoneLabelEn",
      (select count(*)::int from areas k where k.parent_id = c.id) as "childCount",
      (select count(*)::int from users u
         join areas d on d.id = u.area_id
        where u.deleted_at is null and (d.id = c.id or c.id = any(d.ancestor_ids))) as "members",
      (select count(*)::int from venues v
         join areas d on d.id = v.area_id
        where v.deleted_at is null and (d.id = c.id or c.id = any(d.ancestor_ids))) as "venues"
    from areas c
    where ${parentFilter}
    order by
      array_position(array['division','district','city_corporation','upazila','thana','ward','union','area','village']::text[], c.level),
      case when c.level = 'ward' then coalesce(nullif(regexp_replace(c.name_en, '\\D', '', 'g'), '')::int, 0) else 0 end,
      c.name_en
  `);
  return [...rows];
}

export const getLocationById = cache(async (id: number) => {
  const rows = await db.select().from(areas).where(eq(areas.id, id)).limit(1);
  return rows[0] ?? null;
});
