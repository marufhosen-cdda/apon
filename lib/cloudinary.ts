import "server-only";

import { randomUUID } from "node:crypto";

import { cloudinaryConfig } from "@/lib/env";
import { type SignableParams, signParams } from "@/lib/uploads/signature";
import { type FileKind, KIND_MIME, UPLOAD_POLICIES, type UploadPurpose, isImageKind } from "@/lib/uploads/policy";

/**
 * Minimal Cloudinary client over the REST API (no SDK needed).
 *
 * Every call is signed on the server with CLOUDINARY_API_SECRET, which never
 * leaves the server (see `lib/uploads/signature.ts`).
 */

export class CloudinaryError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CloudinaryError";
  }
}

type Params = SignableParams;

export { signParams };

function requireConfig() {
  if (!cloudinaryConfig) throw new CloudinaryError("Cloudinary is not configured");
  return cloudinaryConfig;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

export interface UploadedAsset {
  publicId: string;
  version: number;
  resourceType: "image" | "raw";
  deliveryType: "upload" | "authenticated";
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
  secureUrl: string;
}

/**
 * Upload a validated file. Images are stored as `image` assets (resized on the
 * way in, which also strips EXIF/GPS metadata); PDFs as `raw`. Private
 * purposes use the `authenticated` delivery type so their URLs don't work
 * without a signature.
 */
export async function uploadToCloudinary(input: {
  data: Uint8Array;
  kind: FileKind;
  purpose: UploadPurpose;
  ownerId: string;
}): Promise<UploadedAsset> {
  const config = requireConfig();
  const policy = UPLOAD_POLICIES[input.purpose];
  const resourceType = isImageKind(input.kind) ? "image" : "raw";
  const deliveryType = policy.access === "private" ? "authenticated" : "upload";

  const params: Params = {
    timestamp: nowSeconds(),
    folder: `${config.folder}/${policy.folder}`,
    // Random, unguessable id; raw files keep their extension.
    public_id: resourceType === "raw" ? `${randomUUID()}.pdf` : randomUUID(),
    type: deliveryType,
    overwrite: false,
    // Owner + purpose travel with the asset for audits in the Cloudinary console.
    context: `owner=${input.ownerId}|purpose=${input.purpose}`,
    transformation:
      resourceType === "image" && policy.maxDimension
        ? `c_limit,w_${policy.maxDimension},h_${policy.maxDimension}`
        : undefined,
  };

  const form = new FormData();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) form.append(k, String(v));
  form.append("api_key", config.apiKey);
  form.append("signature", signParams(params, config.apiSecret));
  form.append(
    "file",
    new Blob([input.data as BlobPart], { type: KIND_MIME[input.kind] }),
    `upload.${input.kind === "jpeg" ? "jpg" : input.kind}`,
  );

  const res = await fetch(`${config.apiBase}/v1_1/${config.cloudName}/${resourceType}/upload`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown> & { error?: { message?: string } };
  if (!res.ok) throw new CloudinaryError(body.error?.message ?? `Upload failed (${res.status})`, res.status);

  return {
    publicId: String(body.public_id),
    version: Number(body.version),
    resourceType,
    deliveryType,
    format: String(body.format ?? (resourceType === "raw" ? "pdf" : input.kind)),
    bytes: Number(body.bytes ?? input.data.byteLength),
    width: typeof body.width === "number" ? body.width : null,
    height: typeof body.height === "number" ? body.height : null,
    secureUrl: String(body.secure_url),
  };
}

/** Delete an asset (best effort; used when an image is replaced or removed). */
export async function destroyAsset(asset: {
  publicId: string;
  resourceType: string;
  deliveryType: string;
}): Promise<boolean> {
  const config = requireConfig();
  const params: Params = { public_id: asset.publicId, type: asset.deliveryType, invalidate: true, timestamp: nowSeconds() };
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) form.append(k, String(v));
  form.append("api_key", config.apiKey);
  form.append("signature", signParams(params, config.apiSecret));
  const res = await fetch(`${config.apiBase}/v1_1/${config.cloudName}/${asset.resourceType}/destroy`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(15_000),
  });
  return res.ok;
}

/**
 * Short-lived link to a private (`authenticated`) asset via Cloudinary's
 * signed download endpoint. Generated server-side for admins only.
 */
export function privateDownloadUrl(
  asset: { publicId: string; resourceType: string; format: string },
  { expiresInSeconds = 600, attachment = false } = {},
): string {
  const config = requireConfig();
  const params: Params = {
    public_id: asset.publicId,
    // Raw public ids already include the extension.
    format: asset.resourceType === "raw" ? undefined : asset.format,
    type: "authenticated",
    expires_at: nowSeconds() + expiresInSeconds,
    attachment: attachment ? true : undefined,
    timestamp: nowSeconds(),
  };
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) query.set(k, String(v));
  query.set("api_key", config.apiKey);
  query.set("signature", signParams(params, config.apiSecret));
  return `${config.apiBase}/v1_1/${config.cloudName}/${asset.resourceType}/download?${query.toString()}`;
}

/** True for URLs this app's Cloudinary account serves (public images). */
export function isOwnCloudinaryUrl(url: string): boolean {
  if (!cloudinaryConfig) return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "res.cloudinary.com" && u.pathname.startsWith(`/${cloudinaryConfig.cloudName}/`);
  } catch {
    return false;
  }
}
