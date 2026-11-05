"use server";

import "server-only";

import { eq, like } from "drizzle-orm";

import { ActionError, createAction } from "@/lib/actions/action";
import { db } from "@/lib/db";
import { areas } from "@/lib/db/schema";
import { slugify } from "@/lib/geo/build";
import { CHILD_LEVELS, isLocationLevel } from "@/lib/geo/levels";
import { locationCreateSchema, locationUpdateSchema } from "@/lib/validations";

/**
 * Admin-only edits to the location tree: add places the dataset lacks
 * (villages, new neighbourhoods), fix names, or hide a place from pickers.
 * Rows are never deleted — users, venues and activities may point at them.
 */

export const createLocation = createAction({
  schema: locationCreateSchema,
  authorize: "admin",
  revalidate: ["/admin/locations"],
  handler: async (input) => {
    const [parent] = await db.select().from(areas).where(eq(areas.id, input.parentId)).limit(1);
    if (!parent || !isLocationLevel(parent.level)) throw new ActionError("errors.notFoundTitle");
    if (!CHILD_LEVELS[parent.level].includes(input.level)) throw new ActionError("errors.validation");

    const base = `${parent.slug}-${slugify(input.nameEn)}`;
    const taken = new Set(
      (await db.select({ slug: areas.slug }).from(areas).where(like(areas.slug, `${base}%`))).map((r) => r.slug),
    );
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;

    const [row] = await db
      .insert(areas)
      .values({
        slug,
        nameEn: input.nameEn,
        nameBn: input.nameBn,
        level: input.level,
        parentId: parent.id,
        ancestorIds: [...parent.ancestorIds, parent.id],
        // Children inherit the parent's matching cluster.
        zone: parent.zone,
        zoneLabelEn: parent.zoneLabelEn,
        zoneLabelBn: parent.zoneLabelBn,
      })
      .returning({ id: areas.id });
    return { id: row.id };
  },
});

export const updateLocation = createAction({
  schema: locationUpdateSchema,
  authorize: "admin",
  revalidate: ["/admin/locations"],
  handler: async (input) => {
    const patch: Partial<typeof areas.$inferInsert> = {};
    if (input.nameEn !== undefined) patch.nameEn = input.nameEn;
    if (input.nameBn !== undefined) patch.nameBn = input.nameBn;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    if (Object.keys(patch).length === 0) throw new ActionError("errors.validation");

    const [row] = await db.update(areas).set(patch).where(eq(areas.id, input.id)).returning({ id: areas.id });
    if (!row) throw new ActionError("errors.notFoundTitle");
    return { id: row.id };
  },
});
