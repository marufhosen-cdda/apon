import { NextResponse, type NextRequest } from "next/server";
import createI18nMiddleware from "next-intl/middleware";
import { eq } from "drizzle-orm";

import { routing, isLocale } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { decideAccess, ruleFor, toRole } from "@/lib/rbac";

/**
 * Next.js 16 `proxy` (formerly middleware).
 *
 * Responsibilities, in order:
 *   1. Forward `/api/auth/*` to Better Auth — the project ships no API routes.
 *   2. Apply the role-based route policy from `lib/rbac.ts`:
 *      sign-in redirects, onboarding gate, User Panel vs Admin Panel (403).
 *   3. Hand off to next-intl for locale detection/prefixing.
 *
 * Route groups are invisible in the URL, so the policy is keyed on the path
 * segments after the locale (e.g. `/en/admin/reports` → `admin`). Layouts and
 * Server Actions re-check authorization; this is the first, cheapest line.
 */

const handleI18n = createI18nMiddleware(routing);

function clearSessionCookies(response: NextResponse) {
  response.cookies.delete("better-auth.session_token");
  response.cookies.delete("better-auth.session_data");
  response.cookies.delete("__Secure-better-auth.session_token");
  response.cookies.delete("__Secure-better-auth.session_data");
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  // 1. Better Auth owns /api/auth/*.
  if (pathname === "/api/auth" || pathname.startsWith("/api/auth/")) {
    return auth.handler(request) as unknown as NextResponse;
  }

  // 2. Split off the locale prefix (it may be missing — next-intl will add it).
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0] ?? "";
  const locale = isLocale(firstSegment) ? firstSegment : routing.defaultLocale;
  const rest = isLocale(firstSegment) ? segments.slice(1) : segments;

  // Public pages never need a session lookup.
  if (ruleFor(rest).section === "public") return handleI18n(request);

  const redirectTo = (to: string) => {
    const url = request.nextUrl.clone();
    const [path, query = ""] = to.split("?");
    url.pathname = `/${locale}${path}`;
    url.search = query ? `?${query}` : "";
    return NextResponse.redirect(url);
  };

  // 3. Session + user row (role, status, onboarding).
  const session = await auth.api.getSession({ headers: request.headers });
  const user = session?.user
    ? (await db.select().from(users).where(eq(users.id, session.user.id)).limit(1))[0]
    : undefined;

  // Deleted or suspended accounts are signed out immediately.
  if (session?.user && (!user || user.deletedAt || user.status === "suspended")) {
    const response = redirectTo(user?.status === "suspended" ? "/sign-in?error=suspended" : "/sign-in");
    clearSessionCookies(response);
    return response;
  }

  const decision = decideAccess(
    rest,
    user ? { role: toRole(user.role), onboarded: Boolean(user.onboardedAt) } : null,
    rest.length > 0 ? pathname + search : "",
  );

  if (decision.kind === "redirect") return redirectTo(decision.to);

  if (decision.kind === "forbidden") {
    // Render the localized 403 page in place, with a real 403 status.
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/access-denied`;
    url.search = `?from=${encodeURIComponent(rest[0] ?? "")}`;
    return NextResponse.rewrite(url, { status: 403 });
  }

  return handleI18n(request);
}

export const config = {
  // Skip real files and Next's own assets; keep /api/auth matched.
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
