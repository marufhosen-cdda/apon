/**
 * Upload rules shared by the browser (early feedback) and the server (the
 * real check). Client-safe: no server imports.
 *
 * File types are decided by the file's *content* (magic bytes), never by its
 * name or the browser-reported MIME type. SVG, HTML and other active formats
 * are never accepted.
 */

export type FileKind = "jpeg" | "png" | "webp" | "pdf";

export const KIND_MIME: Record<FileKind, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

const IMAGE_KINDS: FileKind[] = ["jpeg", "png", "webp"];

export const UPLOAD_PURPOSES = [
  "avatar",
  "activity_cover",
  "venue_photo",
  "report_evidence",
  "host_document",
] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

export interface PurposePolicy {
  kinds: FileKind[];
  maxBytes: number;
  /**
   * public  → delivered from Cloudinary's CDN (avatars, covers, venue photos)
   * private → stored as `authenticated`; only admins get short-lived signed links
   */
  access: "public" | "private";
  /** Cloudinary subfolder under CLOUDINARY_FOLDER. */
  folder: string;
  /** Longest edge after Cloudinary's incoming resize (images only). */
  maxDimension?: number;
  /** Who may upload for this purpose. */
  role: "user" | "host" | "admin";
}

const MB = 1024 * 1024;

export const UPLOAD_POLICIES: Record<UploadPurpose, PurposePolicy> = {
  avatar: { kinds: IMAGE_KINDS, maxBytes: 5 * MB, access: "public", folder: "avatars", maxDimension: 800, role: "user" },
  activity_cover: { kinds: IMAGE_KINDS, maxBytes: 5 * MB, access: "public", folder: "activities", maxDimension: 2000, role: "host" },
  venue_photo: { kinds: IMAGE_KINDS, maxBytes: 5 * MB, access: "public", folder: "venues", maxDimension: 2000, role: "admin" },
  report_evidence: { kinds: [...IMAGE_KINDS, "pdf"], maxBytes: 8 * MB, access: "private", folder: "reports", maxDimension: 2400, role: "user" },
  host_document: { kinds: [...IMAGE_KINDS, "pdf"], maxBytes: 8 * MB, access: "private", folder: "host-applications", maxDimension: 2400, role: "user" },
};

/** Largest file any purpose accepts (sizes the Server Action body limit). */
export const MAX_UPLOAD_BYTES = Math.max(...Object.values(UPLOAD_POLICIES).map((p) => p.maxBytes));

export function isUploadPurpose(value: unknown): value is UploadPurpose {
  return typeof value === "string" && (UPLOAD_PURPOSES as readonly string[]).includes(value);
}

export const isImageKind = (kind: FileKind) => kind !== "pdf";

/** `accept` attribute for a file input. */
export function acceptFor(purpose: UploadPurpose): string {
  return UPLOAD_POLICIES[purpose].kinds.map((k) => KIND_MIME[k]).join(",");
}

/** Identify a file by its leading bytes. Returns null for anything unsupported. */
export function sniffFileKind(bytes: Uint8Array): FileKind | null {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (
    b.length >= 8 &&
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a
  ) {
    return "png";
  }
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // RIFF
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // WEBP
  ) {
    return "webp";
  }
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d) return "pdf"; // %PDF-
  return null;
}

export type UploadCheck =
  | { ok: true; kind: FileKind }
  | { ok: false; error: "uploads.errors.empty" | "uploads.errors.tooLarge" | "uploads.errors.type" };

/** Size + content-type check against a purpose's policy. */
export function checkUpload(purpose: UploadPurpose, size: number, head: Uint8Array): UploadCheck {
  const policy = UPLOAD_POLICIES[purpose];
  if (size <= 0) return { ok: false, error: "uploads.errors.empty" };
  if (size > policy.maxBytes) return { ok: false, error: "uploads.errors.tooLarge" };
  const kind = sniffFileKind(head);
  if (!kind || !policy.kinds.includes(kind)) return { ok: false, error: "uploads.errors.type" };
  return { ok: true, kind };
}

/** "Résumé (final).PDF" → "Resume-final.pdf" — safe to show and store. */
export function cleanFileName(name: string, kind: FileKind): string {
  const base = name
    .replace(/\.[^.]*$/, "")
    .normalize("NFKD")
    .replace(/[^\w\s.-]/g, "")
    .replace(/^[.\s]+/, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return `${base || "file"}.${kind === "jpeg" ? "jpg" : kind}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}
