/**
 * Regenerates `lib/geo/data/bd-admin.json` — the rural administrative tree
 * (8 divisions → 64 districts → upazilas → unions) used by `npm run db:seed`.
 *
 * Source: https://github.com/nuhil/bangladesh-geocode (BBS-derived, en + bn names).
 * Usage:  node scripts/build-geo-data.mjs [path/to/downloaded/json/dir]
 * Without an argument the files are fetched from GitHub.
 *
 * The output is committed so seeding works offline and stays reproducible.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = "https://raw.githubusercontent.com/nuhil/bangladesh-geocode/master";
const FILES = {
  divisions: "divisions/divisions.json",
  districts: "districts/districts.json",
  upazilas: "upazilas/upazilas.json",
  unions: "unions/unions.json",
};

/** Upstream uses older English spellings; prefer the current official ones. */
const RENAME = {
  Chattagram: "Chattogram",
  Barisal: "Barishal",
  Comilla: "Cumilla",
  Coxsbazar: "Cox's Bazar",
  Jhalakathi: "Jhalokati",
};

const dir = process.argv[2];

async function load(name) {
  const raw = dir
    ? await readFile(path.join(dir, path.basename(FILES[name])), "utf8")
    : await (await fetch(`${BASE}/${FILES[name]}`)).text();
  const table = JSON.parse(raw).find((entry) => entry.type === "table");
  return table.data;
}

const clean = (s) => RENAME[s.trim()] ?? s.trim().replace(/\s+/g, " ");
const num = (s) => (s ? Math.round(Number(s) * 1e5) / 1e5 : null);

const [divisions, districts, upazilas, unions] = await Promise.all(
  ["divisions", "districts", "upazilas", "unions"].map(load),
);

const seenUnion = new Set();
const out = {
  source: "https://github.com/nuhil/bangladesh-geocode",
  divisions: divisions.map((d) => [Number(d.id), clean(d.name), d.bn_name.trim()]),
  districts: districts.map((d) => [
    Number(d.id),
    Number(d.division_id),
    clean(d.name),
    d.bn_name.trim(),
    num(d.lat),
    num(d.lon),
  ]),
  upazilas: upazilas.map((u) => [
    Number(u.id),
    Number(u.district_id),
    clean(u.name),
    u.bn_name.trim(),
  ]),
  unions: unions
    .filter((u) => {
      const key = `${u.upazilla_id}:${u.name.trim().toLowerCase()}`;
      if (seenUnion.has(key)) return false;
      seenUnion.add(key);
      return true;
    })
    .map((u) => [Number(u.id), Number(u.upazilla_id), clean(u.name), u.bn_name.trim()]),
};

const target = new URL("../lib/geo/data/bd-admin.json", import.meta.url);
// One record per line keeps diffs reviewable.
const body = Object.entries(out)
  .map(([key, value]) =>
    Array.isArray(value)
      ? `  ${JSON.stringify(key)}: [\n${value.map((r) => `    ${JSON.stringify(r)}`).join(",\n")}\n  ]`
      : `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`,
  )
  .join(",\n");
await writeFile(target, `{\n${body}\n}\n`);
console.log(
  `Wrote ${out.divisions.length} divisions, ${out.districts.length} districts, ` +
    `${out.upazilas.length} upazilas, ${out.unions.length} unions.`,
);
