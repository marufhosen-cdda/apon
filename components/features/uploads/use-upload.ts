"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { uploadFile, type UploadedFile } from "@/lib/actions/uploads";
import {
  KIND_MIME,
  UPLOAD_POLICIES,
  checkUpload,
  formatBytes,
  type UploadPurpose,
} from "@/lib/uploads/policy";

/**
 * Validates a file in the browser (same rules as the server, for instant
 * feedback), then sends it to the `uploadFile` Server Action.
 */
export function useUpload(purpose: UploadPurpose) {
  const t = useTranslations("uploads");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const policy = UPLOAD_POLICIES[purpose];
  const size = formatBytes(policy.maxBytes);
  const types = policy.kinds.map((k) => KIND_MIME[k].split("/")[1].toUpperCase().replace("JPEG", "JPG")).join(", ");

  const message = (key: string) => {
    const k = key.replace(/^uploads\.errors\./, "");
    if (key === "errors.rateLimited") return t("errors.rateLimited");
    if (["empty", "tooLarge", "type", "failed", "disabled", "notYours"].includes(k)) {
      return t(`errors.${k}` as "errors.failed", { size, types });
    }
    return t("errors.generic");
  };

  async function upload(file: File): Promise<UploadedFile | null> {
    setError(null);
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const check = checkUpload(purpose, file.size, head);
    if (!check.ok) {
      setError(message(check.error));
      return null;
    }
    setPending(true);
    try {
      const form = new FormData();
      form.set("purpose", purpose);
      form.set("file", file);
      const result = await uploadFile(form);
      if (!result.ok) {
        setError(message(result.error));
        return null;
      }
      return result.data;
    } catch {
      // e.g. body over the Server Action limit, or network failure
      setError(t("errors.failed"));
      return null;
    } finally {
      setPending(false);
    }
  }

  return { upload, pending, error, setError, size, types };
}
