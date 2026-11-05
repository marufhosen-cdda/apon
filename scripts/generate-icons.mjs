/**
 * Generates every APON brand raster: PWA icons, Apple touch icon, favicon.ico.
 *
 * Deliberately dependency-free: a tiny PNG encoder (zlib + CRC32) rasterises
 * the APON mark — an open ring (the circle) with a warm dot sitting in its gap
 * (you: there is always a place for you — "Everyone belongs"). The geometry
 * matches `public/brand/apon-mark.svg`, `app/icon.svg` and
 * `components/brand/logo.tsx`. Run with:
 *
 *   node scripts/generate-icons.mjs
 *
 * Output: public/icons/*.png, public/apple-icon.png, app/favicon.ico
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT_DIR = join(ROOT, "public", "icons");

/** Brand colours — keep in sync with `--primary` / `--brand-accent` in app/globals.css. */
const TEAL = [15, 118, 110];
const WHITE = [255, 255, 255];
const AMBER = [251, 191, 36];

/** Mark geometry in a 512-unit box (shared with the SVGs). */
export const MARK = {
  ringRadius: 148,
  ringWidth: 58,
  /** Gap centre (degrees, clockwise from +x, SVG convention) and half-span. */
  gapCentre: -50,
  gapHalfSpan: 38,
  dotRadius: 46,
};
// ---------------------------------------------------------------- PNG encoder
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i += 1) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData), 0);
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// -------------------------------------------------------------------- drawing
/** Signed distance to a rounded square centred on the canvas. */
function roundedSquareDistance(x, y, size, radius) {
  const dx = Math.abs(x - size / 2) - (size / 2 - radius);
  const dy = Math.abs(y - size / 2) - (size / 2 - radius);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  return outside + Math.min(Math.max(dx, dy), 0) - radius;
}

const rad = (deg) => (deg * Math.PI) / 180;

/** Returns "ring" | "dot" | null for a point, in 512-unit mark space. */
function markHit(ux, uy) {
  const dx = ux - 256;
  const dy = uy - 256;
  const dist = Math.hypot(dx, dy);
  const { ringRadius: R, ringWidth, gapCentre, gapHalfSpan, dotRadius } = MARK;

  // Dot sits in the gap, on the ring's centre line.
  const dotX = Math.cos(rad(gapCentre)) * R;
  const dotY = Math.sin(rad(gapCentre)) * R;
  if (Math.hypot(dx - dotX, dy - dotY) <= dotRadius) return "dot";

  // Open ring with round caps: distance to the arc that excludes the gap.
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  let delta = ((angle - gapCentre + 540) % 360) - 180; // −180…180 from gap centre
  let d;
  if (Math.abs(delta) >= gapHalfSpan) {
    d = Math.abs(dist - R);
  } else {
    const capA = rad(gapCentre + gapHalfSpan);
    const capB = rad(gapCentre - gapHalfSpan);
    d = Math.min(
      Math.hypot(dx - Math.cos(capA) * R, dy - Math.sin(capA) * R),
      Math.hypot(dx - Math.cos(capB) * R, dy - Math.sin(capB) * R),
    );
  }
  return d <= ringWidth / 2 ? "ring" : null;
}

/**
 * Rasterises one icon. `padding` (0–1) shrinks the mark inside the canvas so
 * maskable icons keep everything within the platform's safe zone.
 */
function drawIcon(size, { padding = 0.12, square = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  const cornerRadius = square ? 0 : size * 0.23;
  const scale = 1 - padding;
  const samples = 4;
  const step = 1 / samples;
  const offset = step / 2;
  const total = samples * samples;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let bg = 0;
      let ring = 0;
      let dot = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + sx * step + offset;
          const py = y + sy * step + offset;
          if (roundedSquareDistance(px, py, size, cornerRadius) > 0) continue;
          bg += 1;
          // Canvas → mark space (512 units), scaled around the centre.
          const ux = 256 + ((px - size / 2) / (size * scale)) * 512;
          const uy = 256 + ((py - size / 2) / (size * scale)) * 512;
          const hit = markHit(ux, uy);
          if (hit === "ring") ring += 1;
          else if (hit === "dot") dot += 1;
        }
      }
      const index = (y * size + x) * 4;
      if (bg === 0) continue;
      const tealShare = (bg - ring - dot) / bg;
      for (let c = 0; c < 3; c += 1) {
        rgba[index + c] = Math.round(TEAL[c] * tealShare + WHITE[c] * (ring / bg) + AMBER[c] * (dot / bg));
      }
      rgba[index + 3] = Math.round((bg / total) * 255);
    }
  }
  return encodePng(size, size, rgba);
}

/** ICO container with embedded PNG images (supported by every modern browser). */
function encodeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, png } of images) {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

// ---------------------------------------------------------------------- write
mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  ["icon-192.png", 192, {}],
  ["icon-512.png", 512, {}],
  ["maskable-512.png", 512, { padding: 0.4, square: true }],
];
for (const [name, size, options] of targets) {
  writeFileSync(join(OUT_DIR, name), drawIcon(size, options));
  console.log(`wrote public/icons/${name} (${size}×${size})`);
}

writeFileSync(join(ROOT, "public", "apple-icon.png"), drawIcon(180, { padding: 0.16, square: true }));
console.log("wrote public/apple-icon.png (180×180)");

// Small sizes get a little less padding so the mark stays legible in tabs.
const ico = encodeIco([16, 32, 48].map((size) => ({ size, png: drawIcon(size, { padding: 0.06 }) })));
writeFileSync(join(ROOT, "app", "favicon.ico"), ico);
console.log("wrote app/favicon.ico (16, 32, 48)");
