import "server-only";

import { sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db } from "@/lib/db";

/**
 * Public, aggregate-only numbers for the landing page (no personal data).
 * Cached for 10 minutes so the marketing page stays fast.
 */
export const getLandingStats = unstable_cache(
  async () => {
    const [row] = await db.execute<{
      members: number;
      upcoming: number;
      circles: number;
      venues: number;
      places: number;
      districtsWithMembers: number;
    }>(sql`
      select
        (select count(*)::int from users where deleted_at is null and onboarded_at is not null) as "members",
        (select count(*)::int from activities where status = 'approved' and starts_at > now()) as "upcoming",
        (select count(*)::int from circles where status = 'active' and deleted_at is null) as "circles",
        (select count(*)::int from venues where approved and deleted_at is null) as "venues",
        (select count(*)::int from areas where is_active) as "places",
        (select count(distinct d.id)::int from users u
           join areas a on a.id = u.area_id
           join areas d on d.level = 'district' and (d.id = a.id or d.id = any(a.ancestor_ids))
          where u.deleted_at is null) as "districtsWithMembers"
    `);
    return row ?? { members: 0, upcoming: 0, circles: 0, venues: 0, places: 0, districtsWithMembers: 0 };
  },
  ["landing-stats"],
  { revalidate: 600 },
);

/** Divisions with how many districts each has (coverage section). */
export const getDivisionCoverage = unstable_cache(
  async () => {
    const rows = await db.execute<{ id: number; nameEn: string; nameBn: string; districts: number; upazilas: number }>(sql`
      select d.id, d.name_en as "nameEn", d.name_bn as "nameBn",
        (select count(*)::int from areas c where c.level = 'district' and d.id = any(c.ancestor_ids)) as "districts",
        (select count(*)::int from areas c where c.level = 'upazila' and d.id = any(c.ancestor_ids)) as "upazilas"
      from areas d where d.level = 'division' order by d.name_en
    `);
    return [...rows];
  },
  ["landing-division-coverage"],
  { revalidate: 3600 },
);
