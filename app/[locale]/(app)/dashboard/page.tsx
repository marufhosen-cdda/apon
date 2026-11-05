import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { requireUser } from "@/lib/session";
import { homePathFor, toRole } from "@/lib/rbac";

/** Role-aware landing page (the proxy normally redirects before this renders). */
export default async function DashboardPage() {
  const [user, locale] = await Promise.all([requireUser(), getLocale()]);
  redirect(`/${locale}${homePathFor(toRole(user.role))}`);
}
