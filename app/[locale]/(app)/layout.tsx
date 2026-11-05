import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";
import { can } from "@/lib/rbac";
import { LocaleSwitcher } from "@/components/features/nav/locale-switcher";
import { ThemeToggle } from "@/components/features/nav/theme-toggle";
import { NavLinks } from "@/components/features/nav/nav-links";
import { BottomNav } from "@/components/features/nav/bottom-nav";
import { NotificationBell } from "@/components/features/nav/notification-bell";
import { UserMenu } from "@/components/features/nav/user-menu";

/**
 * User Panel shell (members, hosts — and admins when they use the app as a
 * member): compact top bar + mobile bottom nav. The Admin Panel has its own,
 * separate shell in `(admin)/layout.tsx`.
 *
 * The proxy already guards these paths; the server-side check here is the
 * authoritative one (the proxy can be bypassed by misconfigured rewrites).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const [t, tn] = await Promise.all([getTranslations("common"), getTranslations("nav")]);
  const isHost = can(user.role, "activities.host");
  const isAdmin = can(user.role, "admin.access");

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-5">
            <Link
              href="/home"
              className="flex items-center gap-2 text-[15px] font-semibold tracking-tight"
              aria-label={t("appName")}
            >
              <Logo hideWordmarkOnMobile />
            </Link>
            <NavLinks isHost={isHost} />
          </div>

          <div className="flex items-center gap-1">
            {isAdmin ? (
              <Link
                href="/admin"
                className="mr-1 hidden h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:inline-flex"
              >
                <Shield className="size-3.5 text-info" aria-hidden />
                {tn("adminPanel")}
              </Link>
            ) : null}
            <ThemeToggle />
            <LocaleSwitcher />
            <NotificationBell userId={user.id} />
            <UserMenu
              panel="member"
              user={{
                id: user.id,
                name: user.name,
                avatarUrl: user.avatarUrl,
                role: user.role,
              }}
            />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl px-4 pb-24 pt-5 sm:px-6 md:pb-12">
        {children}
      </main>

      <BottomNav isHost={isHost} isMember />
    </div>
  );
}
