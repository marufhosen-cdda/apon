"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowUpRight,
  CalendarCheck2,
  Gauge,
  LayoutDashboard,
  ListChecks,
  MapPinned,
  Menu,
  Network,
  ShieldAlert,
  Store,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export interface AdminBadges {
  openReports: number;
  pendingApplications: number;
  pendingActivities: number;
  openRequests: number;
}

interface NavItem {
  href: string;
  key: string;
  icon: LucideIcon;
  badge?: keyof AdminBadges;
}

const GROUPS: { key: string | null; items: NavItem[] }[] = [
  { key: null, items: [{ href: "/admin", key: "overview", icon: LayoutDashboard }] },
  {
    key: "community",
    items: [
      { href: "/admin/users", key: "users", icon: Users },
      { href: "/admin/reports", key: "reports", icon: ShieldAlert, badge: "openReports" },
      { href: "/admin/host-applications", key: "hosts", icon: ListChecks, badge: "pendingApplications" },
    ],
  },
  {
    key: "content",
    items: [
      { href: "/admin/activities", key: "activities", icon: CalendarCheck2, badge: "pendingActivities" },
      { href: "/admin/venues", key: "venues", icon: Store },
      { href: "/admin/locations", key: "locations", icon: MapPinned },
      { href: "/admin/circles", key: "circles", icon: Network, badge: "openRequests" },
    ],
  },
  { key: "insights", items: [{ href: "/admin/metrics", key: "metrics", icon: Gauge }] },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Current section title for the top bar, derived from the nav. */
export function useAdminSectionKey() {
  const pathname = usePathname();
  for (const group of GROUPS) for (const item of group.items) if (isActive(pathname, item.href)) return item.key;
  return "overview";
}

function SidebarNav({ badges, onNavigate }: { badges: AdminBadges; onNavigate?: () => void }) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <nav aria-label={t("consoleLabel")} className="flex-1 space-y-5 overflow-y-auto px-3 py-4 scrollbar-thin">
      {GROUPS.map((group) => (
        <div key={group.key ?? "root"} className="space-y-0.5">
          {group.key ? (
            <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-muted">
              {t(group.key)}
            </p>
          ) : null}
          {group.items.map((item) => {
            const active = isActive(pathname, item.href);
            const count = item.badge ? badges[item.badge] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
                )}
              >
                <item.icon
                  className={cn("size-4 shrink-0", active ? "text-sidebar-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground")}
                  aria-hidden
                />
                <span className="flex-1 truncate">{t(item.key)}</span>
                {count > 0 ? (
                  <span className="tabular rounded bg-sidebar-primary/15 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-sidebar-primary">
                    {count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  const t = useTranslations("admin.nav");
  return (
    <Link href="/admin" className="flex items-center px-4 py-4">
      <Logo tone="inverse" tagline={t("consoleLabel")} markClassName="size-8" />
    </Link>
  );
}

function SidebarFooter() {
  const t = useTranslations("admin.nav");
  return (
    <div className="border-t border-sidebar-border p-3">
      <Link
        href="/home"
        className="flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] text-sidebar-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-white"
      >
        <ArrowUpRight className="size-4 text-sidebar-muted" aria-hidden />
        {t("viewSite")}
      </Link>
    </div>
  );
}

/** Fixed sidebar on desktop. */
export function AdminSidebar({ badges }: { badges: AdminBadges }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <Brand />
      <SidebarNav badges={badges} />
      <SidebarFooter />
    </aside>
  );
}

/** Hamburger + slide-over drawer on mobile/tablet. */
export function AdminMobileNav({ badges }: { badges: AdminBadges }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
        aria-label={t("openMenu")}
      >
        <Menu className="size-5" aria-hidden />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 lg:hidden" />
        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-sidebar shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left lg:hidden">
          <DialogPrimitive.Title className="sr-only">{t("adminPanel")}</DialogPrimitive.Title>
          <div className="flex items-center justify-between pr-3">
            <Brand />
            <DialogPrimitive.Close
              className="grid size-8 place-items-center rounded-md text-sidebar-muted hover:bg-sidebar-accent hover:text-white"
              aria-label={t("closeMenu")}
            >
              <X className="size-4" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          <SidebarNav badges={badges} onNavigate={() => setOpen(false)} />
          <SidebarFooter />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Top-bar section title (client, so it follows navigation). */
export function AdminSectionTitle() {
  const t = useTranslations("admin.nav");
  const key = useAdminSectionKey();
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{t("consoleLabel")}</p>
      <p className="truncate text-sm font-semibold">{t(key)}</p>
    </div>
  );
}
