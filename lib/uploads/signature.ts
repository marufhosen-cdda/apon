import { createHash } from "node:crypto";

/**
 * Cloudinary request signing (server-side only — needs the API secret).
 * Sort the parameters, join as `k=v&k=v`, append the secret, SHA-1 hex.
 * https://cloudinary.com/documentation/authentication_signatures
 */

export type SignableParams = Record<string, string | number | boolean | undefined>;

/** Parameters Cloudinary excludes from the signature. */
const UNSIGNED = new Set(["file", "cloud_name", "resource_type", "api_key", "signature"]);

export function signParams(params: SignableParams, apiSecret: string): string {
  const toSign = Object.keys(params)
    .filter((k) => !UNSIGNED.has(k) && params[k] !== undefined && params[k] !== "")
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}
