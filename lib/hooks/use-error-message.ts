"use client";

import { useTranslations } from "next-intl";

/**
 * Turns a Server Action error (a translation key such as
 * `activities.detail.womenOnlyNote` or `errors.rateLimited`) into a sentence
 * in the user's language. Never shows a raw key: unknown keys and free-text
 * errors fall back to `fallback` (default: the generic error).
 */
export function useErrorMessage() {
  const t = useTranslations();
  return (key: string | null | undefined, fallback: string = "errors.generic"): string => {
    const candidates = [key, fallback, "errors.generic"];
    for (const candidate of candidates) {
      if (!candidate || !/^[a-zA-Z][\w-]*(\.[\w-]+)+$/.test(candidate) || !t.has(candidate)) continue;
      try {
        const message = t(candidate);
        if (typeof message === "string" && message && message !== candidate) return message;
      } catch {
        // A namespace (object) rather than a message, or a message needing values.
      }
    }
    return "Something went wrong. Please try again.";
  };
}
