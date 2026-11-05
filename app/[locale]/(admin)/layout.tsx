import { requireAdmin } from "@/lib/session";
import { getAdminQueueCounts } from "@/lib/queries/admin";
import { LocaleSwitcher } from "@/components/features/nav/locale-switcher";
import { ThemeToggle } from "@/components/features/nav/theme-toggle";
import { UserMenu } from "@/components/features/nav/user-menu";
import {
  AdminMobileNav,
  AdminSectionTitle,
  AdminSidebar,
} from "@/components/features/admin/admin-shell";

/**
 * Admin Panel shell — deliberately a different layout from the member app:
 * dark fixed sidebar with grouped navigation and live queue badges, a slim
 * top bar, and a wide content area for tables.
 *
 * `proxy.ts` already returns 403 for non-admins; `requireAdmin()` here is the
 * authoritative check (it calls `forbidden()`), so this tree never renders
 * for anyone else.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const badges = await getAdminQueueCounts();

  return (
    <div className="min-h-dvh bg-background">
      <AdminSidebar badges={badges} />

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <AdminMobileNav badges={badges} />
            <AdminSectionTitle />
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <LocaleSwitcher />
              <UserMenu
                panel="admin"
                user={{ id: user.id, name: user.name, avatarUrl: user.avatarUrl, role: user.role }}
              />
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
