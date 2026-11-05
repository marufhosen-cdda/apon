import { describe, expect, it } from "vitest";

import adminData from "@/lib/geo/data/bd-admin.json";
import { type AdminData, buildLocationTree, slugify, toBnDigits } from "@/lib/geo/build";
import { CITY_CORPORATIONS, DHAKA_ZONES } from "@/lib/geo/data/urban";
import { CHILD_LEVELS, formatTrail, type LocationCrumb } from "@/lib/geo/levels";

const tree = buildLocationTree(adminData as unknown as AdminData);
const bySlug = new Map(tree.map((n) => [n.slug, n]));
const count = (level: string) => tree.filter((n) => n.level === level).length;

describe("Bangladesh location tree", () => {
  it("covers every administrative level", () => {
    expect(count("division")).toBe(8);
    expect(count("district")).toBe(64);
    expect(count("upazila")).toBeGreaterThanOrEqual(490);
    expect(count("union")).toBeGreaterThanOrEqual(4500);
    expect(count("city_corporation")).toBe(12);
    expect(count("thana")).toBeGreaterThanOrEqual(100);
    expect(count("ward")).toBe(CITY_CORPORATIONS.reduce((sum, cc) => sum + cc.wards, 0));
    expect(count("area")).toBeGreaterThan(150);
  });

  it("has unique slugs and lists parents before children", () => {
    const seen = new Set<string>();
    for (const node of tree) {
      expect(seen.has(node.slug)).toBe(false);
      if (node.parentSlug) expect(seen.has(node.parentSlug)).toBe(true);
      seen.add(node.slug);
    }
  });

  it("only nests levels the hierarchy allows", () => {
    for (const node of tree) {
      if (!node.parentSlug) {
        expect(node.level).toBe("division");
        continue;
      }
      const parent = bySlug.get(node.parentSlug)!;
      expect(CHILD_LEVELS[parent.level]).toContain(node.level);
    }
  });

  it("uses current official spellings", () => {
    expect(bySlug.get("chattogram-division")?.nameEn).toBe("Chattogram");
    expect(bySlug.get("barishal-division")?.nameEn).toBe("Barishal");
    expect(bySlug.get("cumilla-district")?.nameEn).toBe("Cumilla");
    expect(bySlug.get("coxs-bazar-district")?.nameEn).toBe("Cox's Bazar");
  });

  it("places Dhaka neighbourhoods under their thana and city corporation", () => {
    const gulshan2 = bySlug.get("gulshan-2")!;
    expect(gulshan2.level).toBe("area");
    expect(gulshan2.nameBn).toBe("গুলশান ২");
    const thana = bySlug.get(gulshan2.parentSlug!)!;
    expect(thana.level).toBe("thana");
    expect(thana.parentSlug).toBe("dhaka-north");
    expect(bySlug.get("dhaka-north")!.parentSlug).toBe("dhaka-district");
    expect(bySlug.get("dhaka-district")!.parentSlug).toBe("dhaka-division");
    expect(bySlug.get("dhanmondi")!.parentSlug).toBe("dhaka-south-dhanmondi-thana");
  });

  it("keeps the legacy demo slugs and their matching zones", () => {
    const legacy: Record<string, string> = {
      dhanmondi: "dhanmondi",
      mohammadpur: "dhanmondi",
      lalmatia: "dhanmondi",
      kalabagan: "dhanmondi",
      "gulshan-1": "gulshan",
      "gulshan-2": "gulshan",
      banani: "gulshan",
      bashundhara: "gulshan",
      "mirpur-10": "mirpur",
      "mirpur-6": "mirpur",
      kazipara: "mirpur",
      rupnagar: "mirpur",
      "uttara-3": "uttara",
      "uttara-7": "uttara",
      "uttara-11": "uttara",
      ashkona: "uttara",
    };
    for (const [slug, zone] of Object.entries(legacy))
      expect(bySlug.get(slug)?.zone, slug).toBe(zone);
  });

  it("assigns every node a known matching zone", () => {
    for (const node of tree) {
      expect(node.zone).toBeTruthy();
      expect(node.zoneLabelEn).toBeTruthy();
      expect(node.zoneLabelBn).toBeTruthy();
    }
    const dhakaZones = new Set(
      tree
        .filter(
          (n) =>
            n.parentSlug?.startsWith("dhaka-north") ||
            n.parentSlug?.startsWith("dhaka-south"),
        )
        .map((n) => n.zone),
    );
    for (const zone of dhakaZones) {
      expect(
        zone in DHAKA_ZONES || zone === "dhaka-north" || zone === "dhaka-south",
      ).toBe(true);
    }
  });

  it("lets unions inherit their upazila's zone", () => {
    const union = tree.find((n) => n.level === "union")!;
    const upazila = bySlug.get(union.parentSlug!)!;
    expect(upazila.level).toBe("upazila");
    expect(union.zone).toBe(upazila.zone);
  });

  it("matches other cities city-wide", () => {
    const agrabad = bySlug.get("agrabad")!;
    expect(agrabad.zone).toBe("chattogram-city");
    expect(bySlug.get("sylhet-city-ward-42")?.zone).toBe("sylhet-city");
  });

  it("names wards in both languages", () => {
    const ward = bySlug.get("dhaka-south-ward-75")!;
    expect(ward.nameEn).toBe("Ward 75");
    expect(ward.nameBn).toBe("ওয়ার্ড ৭৫");
  });
});

describe("geo helpers", () => {
  it("slugifies English place names", () => {
    expect(slugify("Cox's Bazar")).toBe("coxs-bazar");
    expect(slugify("Sher-e-Bangla Nagar")).toBe("sher-e-bangla-nagar");
    expect(slugify("Bashundhara R/A")).toBe("bashundhara-r-a");
    expect(slugify("  2 No. Gate ")).toBe("2-no-gate");
  });

  it("converts digits to Bangla numerals", () => {
    expect(toBnDigits(2026)).toBe("২০২৬");
  });

  it("formats a trail most-specific first and skips the division", () => {
    const trail: LocationCrumb[] = [
      {
        id: 1,
        slug: "dhaka-division",
        level: "division",
        nameEn: "Dhaka",
        nameBn: "ঢাকা",
      },
      {
        id: 2,
        slug: "dhaka-district",
        level: "district",
        nameEn: "Dhaka",
        nameBn: "ঢাকা",
      },
      {
        id: 3,
        slug: "dhaka-north",
        level: "city_corporation",
        nameEn: "Dhaka North City Corporation",
        nameBn: "ঢাকা উত্তর সিটি কর্পোরেশন",
      },
      { id: 4, slug: "t", level: "thana", nameEn: "Gulshan", nameBn: "গুলশান" },
      {
        id: 5,
        slug: "gulshan-2",
        level: "area",
        nameEn: "Gulshan 2",
        nameBn: "গুলশান ২",
      },
    ];
    expect(formatTrail(trail, "en")).toBe(
      "Gulshan 2, Gulshan, Dhaka North City Corporation",
    );
    expect(formatTrail(trail, "bn", 2)).toBe("গুলশান ২, গুলশান");
  });
});
