"use server";

import "server-only";

import { db } from "@/lib/db";
import { uploads } from "@/lib/db/schema";
import { CloudinaryError, uploadToCloudinary } from "@/lib/cloudinary";
import { uploadsEnabled } from "@/lib/env";
import { consumeRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { can } from "@/lib/rbac";
import { getCurrentUser } from "@/lib/session";
import {
  UPLOAD_POLICIES,
  checkUpload,
  cleanFileName,
  isUploadPurpose,
} from "@/lib/uploads/policy";

export interface UploadedFile {
  id: number;
  /** CDN URL for public images; empty for private attachments. */
  url: string;
  name: string;
  bytes: number;
  format: string;
  width: number | null;
  height: number | null;
}

export type UploadResult = { ok: true; data: UploadedFile } | { ok: false; error: string };

/**
 * Upload one file to Cloudinary.
 *
 *   signed-in + not suspended → role allowed for the purpose → rate limit →
 *   size limit → content sniffing (magic bytes) → signed Cloudinary upload →
 *   `uploads` row owned by the caller
 *
 * The browser never talks to Cloudinary directly and never sees credentials.
 * Expects FormData with `file` and `purpose`.
 */
export async function uploadFile(formData: FormData): Promise<UploadResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "errors.sessionExpired" };
    if (user.status === "suspended") return { ok: false, error: "errors.unauthorized" };
    if (!uploadsEnabled) return { ok: false, error: "uploads.errors.disabled" };

    const purpose = formData.get("purpose");
    if (!isUploadPurpose(purpose)) return { ok: false, error: "errors.validation" };
    const policy = UPLOAD_POLICIES[purpose];
    if (policy.role === "host" && !can(user.role, "activities.host")) return { ok: false, error: "errors.unauthorized" };
    if (policy.role === "admin" && !can(user.role, "admin.venues")) return { ok: false, error: "errors.unauthorized" };

    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "uploads.errors.empty" };

    const limit = await consumeRateLimit(`app:upload:${user.id}`, RATE_LIMITS.upload);
    if (!limit.ok) return { ok: false, error: "errors.rateLimited" };

    // Size first (cheap, before reading the body), then sniff the real content.
    if (file.size <= 0) return { ok: false, error: "uploads.errors.empty" };
    if (file.size > policy.maxBytes) return { ok: false, error: "uploads.errors.tooLarge" };
    const data = new Uint8Array(await file.arrayBuffer());
    const check = checkUpload(purpose, data.byteLength, data.subarray(0, 16));
    if (!check.ok) return { ok: false, error: check.error };

    const asset = await uploadToCloudinary({ data, kind: check.kind, purpose, ownerId: user.id });

    const [row] = await db
      .insert(uploads)
      .values({
        ownerId: user.id,
        purpose,
        publicId: asset.publicId,
        resourceType: asset.resourceType,
        deliveryType: asset.deliveryType,
        format: asset.format,
        bytes: asset.bytes,
        width: asset.width,
        height: asset.height,
        secureUrl: asset.secureUrl,
        originalName: cleanFileName(file.name, check.kind),
      })
      .returning();

    return {
      ok: true,
      data: {
        id: row.id,
        url: policy.access === "public" ? row.secureUrl : "",
        name: row.originalName,
        bytes: row.bytes,
        format: row.format,
        width: row.width,
        height: row.height,
      },
    };
  } catch (err) {
    console.error("[uploads] upload failed", err instanceof CloudinaryError ? `${err.status}: ${err.message}` : err);
    return { ok: false, error: "uploads.errors.failed" };
  }
}
