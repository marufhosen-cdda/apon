/**
 * Pure builder for the nationwide location tree — no I/O, unit-testable.
 *
 * Combines the official rural tree (`data/bd-admin.json`: divisions,
 * districts, upazilas, unions) with the hand-curated urban layer
 * (`data/urban.ts`: city corporations, metropolitan thanas, wards and
 * neighbourhoods) into one flat list, parents always before children.
 *
 * Matching zones:
 *   - rural: the upazila (unions and villages inherit it)
 *   - Dhaka: neighbourhood clusters of thanas (`DHAKA_ZONES`)
 *   - other cities: the whole city corporation
 *   - a bare district: the district
 */
import type { LocationLevel } from "./levels";
import { CITY_CORPORATIONS, DHAKA_ZONES } from "./data/urban";

export interface AdminData {
  divisions: [number, string, string][];
  districts: [number, number, string, string, number | null, number | null][];
  upazilas: [number, number, string, string][];
  unions: [number, number, string, string][];
}

export interface LocationNode {
  slug: string;
  parentSlug: string | null;
  level: LocationLevel;
  nameEn: string;
  nameBn: string;
  zone: string;
  zoneLabelEn: string;
  zoneLabelBn: string;
  /** Source id for traceability, e.g. `upazila:123`. */
  code: string | null;
  lat: number | null;
  lng: number | null;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['’.]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
export const toBnDigits = (n: number) =>
  String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

/** Short city name for zone labels: "Dhaka North City Corporation" → "Dhaka North". */
const shortCity = (name: string) =>
  name.replace(/ City Corporation$/, "").replace(/ সিটি কর্পোরেশন$/, "");

export function buildLocationTree(data: AdminData): LocationNode[] {
  const nodes: LocationNode[] = [];
  const slugs = new Set<string>();

  const push = (node: LocationNode) => {
    if (slugs.has(node.slug)) throw new Error(`Duplicate location slug: ${node.slug}`);
    slugs.add(node.slug);
    nodes.push(node);
  };

  /** Prefer `base`; fall back to `fallback` when `base` is already taken. */
  const unique = (base: string, fallback: string) => {
    if (!slugs.has(base)) return base;
    let candidate = fallback;
    let n = 2;
    while (slugs.has(candidate)) candidate = `${fallback}-${n++}`;
    return candidate;
  };

  // Divisions -------------------------------------------------------------
  const divisionSlug = new Map<number, string>();
  for (const [id, en, bn] of data.divisions) {
    const slug = `${slugify(en)}-division`;
    divisionSlug.set(id, slug);
    push({
      slug,
      parentSlug: null,
      level: "division",
      nameEn: en,
      nameBn: bn,
      zone: slug,
      zoneLabelEn: en,
      zoneLabelBn: bn,
      code: `division:${id}`,
      lat: null,
      lng: null,
    });
  }

  // Districts -------------------------------------------------------------
  const districtSlug = new Map<number, string>();
  const districtByName = new Map<string, { slug: string; en: string; bn: string }>();
  for (const [id, divisionId, en, bn, lat, lng] of data.districts) {
    const parentSlug = divisionSlug.get(divisionId);
    if (!parentSlug) throw new Error(`District ${en} has unknown division ${divisionId}`);
    const slug = `${slugify(en)}-district`;
    districtSlug.set(id, slug);
    districtByName.set(en, { slug, en, bn });
    push({
      slug,
      parentSlug,
      level: "district",
      nameEn: en,
      nameBn: bn,
      zone: slug,
      zoneLabelEn: en,
      zoneLabelBn: bn,
      code: `district:${id}`,
      lat,
      lng,
    });
  }

  // City corporations, wards, thanas, local areas ---------------------------
  for (const cc of CITY_CORPORATIONS) {
    const district = districtByName.get(cc.district);
    if (!district)
      throw new Error(`City corporation ${cc.en} has unknown district ${cc.district}`);
    const city = { zone: cc.slug, en: shortCity(cc.en), bn: shortCity(cc.bn) };
    push({
      slug: cc.slug,
      parentSlug: district.slug,
      level: "city_corporation",
      nameEn: cc.en,
      nameBn: cc.bn,
      zone: city.zone,
      zoneLabelEn: city.en,
      zoneLabelBn: city.bn,
      code: null,
      lat: cc.lat,
      lng: cc.lng,
    });

    for (const thana of cc.thanas) {
      const cluster = thana.zone ? DHAKA_ZONES[thana.zone] : undefined;
      if (thana.zone && !cluster) throw new Error(`Unknown Dhaka zone ${thana.zone}`);
      const zone = cluster ? { zone: thana.zone!, en: cluster.en, bn: cluster.bn } : city;
      const thanaSlug = `${cc.slug}-${slugify(thana.en)}-thana`;
      push({
        slug: thanaSlug,
        parentSlug: cc.slug,
        level: "thana",
        nameEn: thana.en,
        nameBn: thana.bn,
        zone: zone.zone,
        zoneLabelEn: zone.en,
        zoneLabelBn: zone.bn,
        code: null,
        lat: null,
        lng: null,
      });

      for (const area of thana.areas ?? []) {
        const slug =
          area.slug ?? unique(slugify(area.en), `${cc.slug}-${slugify(area.en)}`);
        push({
          slug,
          parentSlug: thanaSlug,
          level: "area",
          nameEn: area.en,
          nameBn: area.bn,
          zone: zone.zone,
          zoneLabelEn: zone.en,
          zoneLabelBn: zone.bn,
          code: null,
          lat: null,
          lng: null,
        });
      }
    }

    for (let ward = 1; ward <= cc.wards; ward++) {
      push({
        slug: `${cc.slug}-ward-${ward}`,
        parentSlug: cc.slug,
        level: "ward",
        nameEn: `Ward ${ward}`,
        nameBn: `ওয়ার্ড ${toBnDigits(ward)}`,
        zone: city.zone,
        zoneLabelEn: city.en,
        zoneLabelBn: city.bn,
        code: null,
        lat: null,
        lng: null,
      });
    }
  }

  // Upazilas -----------------------------------------------------------------
  const upazila = new Map<number, LocationNode>();
  const districtNames = new Map(data.districts.map(([id, , en, bn]) => [id, { en, bn }]));
  for (const [id, districtId, en, bn] of data.upazilas) {
    const parentSlug = districtSlug.get(districtId);
    const district = districtNames.get(districtId);
    if (!parentSlug || !district)
      throw new Error(`Upazila ${en} has unknown district ${districtId}`);
    const slug = unique(
      `${slugify(district.en)}-${slugify(en)}`,
      `${slugify(district.en)}-${slugify(en)}-upazila`,
    );
    const node: LocationNode = {
      slug,
      parentSlug,
      level: "upazila",
      nameEn: en,
      nameBn: bn,
      zone: slug,
      zoneLabelEn: `${en}, ${district.en}`,
      zoneLabelBn: `${bn}, ${district.bn}`,
      code: `upazila:${id}`,
      lat: null,
      lng: null,
    };
    upazila.set(id, node);
    push(node);
  }

  // Unions -------------------------------------------------------------------
  for (const [id, upazilaId, en, bn] of data.unions) {
    const parent = upazila.get(upazilaId);
    if (!parent) throw new Error(`Union ${en} has unknown upazila ${upazilaId}`);
    const slug = unique(
      `${parent.slug}-${slugify(en)}`,
      `${parent.slug}-${slugify(en)}-union`,
    );
    push({
      slug,
      parentSlug: parent.slug,
      level: "union",
      nameEn: en,
      nameBn: bn,
      zone: parent.zone,
      zoneLabelEn: parent.zoneLabelEn,
      zoneLabelBn: parent.zoneLabelBn,
      code: `union:${id}`,
      lat: null,
      lng: null,
    });
  }

  return nodes;
}

/** Zone a new child inherits (used when admins add villages/areas later). */
export function childZone(
  parent: Pick<LocationNode, "level" | "slug" | "zone" | "zoneLabelEn" | "zoneLabelBn">,
) {
  return {
    zone: parent.zone,
    zoneLabelEn: parent.zoneLabelEn,
    zoneLabelBn: parent.zoneLabelBn,
  };
}
