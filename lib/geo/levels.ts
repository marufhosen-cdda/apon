/**
 * Location hierarchy shared by the server and the client picker.
 *
 *   division → district → upazila  → union → village
 *                       → city_corporation → thana → area
 *                                          → ward
 *
 * Kept free of server-only imports so client components can use it.
 */
export const LOCATION_LEVELS = [
  "division",
  "district",
  "city_corporation",
  "upazila",
  "thana",
  "ward",
  "union",
  "area",
  "village",
] as const;

export type LocationLevel = (typeof LOCATION_LEVELS)[number];

/** Levels a member may save as "where I live". Divisions are too broad to match on. */
export const SELECTABLE_LEVELS: ReadonlySet<LocationLevel> = new Set([
  "district",
  "city_corporation",
  "upazila",
  "thana",
  "ward",
  "union",
  "area",
  "village",
]);

/** Which levels may sit directly under each level (admin "add location" uses this). */
export const CHILD_LEVELS: Record<LocationLevel, LocationLevel[]> = {
  division: ["district"],
  district: ["city_corporation", "upazila"],
  city_corporation: ["thana", "ward"],
  upazila: ["union", "area"],
  thana: ["area"],
  ward: ["area"],
  union: ["village"],
  area: [],
  village: [],
};

export function isLocationLevel(value: string): value is LocationLevel {
  return (LOCATION_LEVELS as readonly string[]).includes(value);
}

export interface LocationOption {
  id: number;
  slug: string;
  level: LocationLevel;
  nameEn: string;
  nameBn: string;
  childCount: number;
}

/** One step of an ancestor trail, root first. */
export interface LocationCrumb {
  id: number;
  slug: string;
  level: LocationLevel;
  nameEn: string;
  nameBn: string;
}

export interface LocationSearchResult extends LocationOption {
  /** Root-first, including the hit itself. */
  trail: LocationCrumb[];
}

export function localizedName(
  item: { nameEn: string; nameBn: string },
  locale: string,
): string {
  return locale === "bn" ? item.nameBn : item.nameEn;
}

/** "Gulshan 2, Gulshan, Dhaka North City Corporation" — most specific first. */
export function formatTrail(trail: LocationCrumb[], locale: string, max = 3): string {
  const names: string[] = [];
  for (const crumb of [...trail].reverse()) {
    if (crumb.level === "division") continue;
    const name = localizedName(crumb, locale);
    // "Banani" area inside "Banani" thana reads once.
    if (names.at(-1) !== name) names.push(name);
  }
  return names.slice(0, max).join(", ");
}
