import type { Metadata } from "next";

import { AccessDenied } from "@/components/features/access/access-denied";

export const metadata: Metadata = { title: "Access denied", robots: { index: false } };

/**
 * Target of the proxy's 403 rewrite (`proxy.ts`). Reachable directly too,
 * which is harmless: it only explains why access was refused.
 */
export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  return <AccessDenied section={from} />;
}
