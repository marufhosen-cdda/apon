import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CircleDot,
  Flag,
  ListChecks,
  MapPinned,
  Network,
  ShieldAlert,
  UserPlus,
  Users,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/session";
import {
  getAdminOverview,
  getAdminQueueCounts,
  getMembersByDivision,
  getRoleBreakdown,
} from "@/lib/queries/admin";
import { getLocationLevelCounts } from "@/lib/queries/locations";
import { localizedName } from "@/lib/geo/levels";
import { AdminPageHeader } from "@/components/features/admin/admin-page-header";
import { StatTile } from "@/components/features/shared/stat-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("admin.overview");
  return { title: t("title") };
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const [t, tu, tr, tl, locale, { totals, recentSignups }, queues, divisions, roles, levels] = await Promise.all([
    getTranslations("admin.overview"),
    getTranslations("admin.users"),
    getTranslations("roles"),
    getTranslations("locations.levels"),
    getLocale(),
    getAdminOverview(),
    getAdminQueueCounts(),
    getMembersByDivision(),
    getRoleBreakdown(),
    getLocationLevelCounts(),
  ]);

  const kpis = [
    { key: "totalUsers", value: totals.totalUsers, icon: Users, href: "/admin/users" },
    { key: "newThisWeek", value: totals.newThisWeek, icon: UserPlus, href: "/admin/users", tone: "success" },
    { key: "upcomingActivities", value: totals.upcomingActivities, icon: CalendarClock, href: "/admin/activities" },
    { key: "activeCircles", value: totals.activeCircles, icon: CircleDot, href: "/admin/circles" },
    { key: "openReports", value: totals.openReports, icon: Flag, href: "/admin/reports", tone: totals.openReports ? "warning" : "default" },
    {
      key: "pendingApprovals",
      value: totals.pendingActivities + totals.pendingApplications + totals.pendingRequests,
      icon: ListChecks,
      href: "/admin/activities",
      tone: "info",
    },
  ] as const;

  const queueItems = [
    { key: "queueReports", count: queues.openReports, href: "/admin/reports", icon: ShieldAlert },
    { key: "queueHosts", count: queues.pendingApplications, href: "/admin/host-applications", icon: ListChecks },
    { key: "queueActivities", count: queues.pendingActivities, href: "/admin/activities", icon: CalendarCheck2 },
    { key: "queueRequests", count: queues.openRequests, href: "/admin/circles", icon: Network },
  ] as const;

  const maxMembers = Math.max(1, ...divisions.map((d) => d.members));
  const roleTotal = Math.max(1, Object.values(roles).reduce((a, b) => a + b, 0));

  return (
    <div className="space-y-5">
      <AdminPageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <StatTile
            key={kpi.key}
            icon={kpi.icon}
            label={t(kpi.key)}
            value={kpi.value}
            href={kpi.href}
            tone={"tone" in kpi ? kpi.tone : "default"}
          />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Work queues */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("queues")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 px-2 pb-2">
            {queueItems.map((q) => (
              <Link
                key={q.key}
                href={q.href}
                className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/70"
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg",
                    q.count ? "bg-warning/10 text-warning" : "bg-success/10 text-success",
                  )}
                >
                  <q.icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{t(q.key)}</span>
                {q.count ? (
                  <Badge variant="warning" className="tabular">{q.count}</Badge>
                ) : (
                  <span className="shrink-0 text-xs text-muted-foreground">{t("allClear")}</span>
                )}
                <ArrowRight className="size-3.5 text-muted-foreground" aria-hidden />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Members by division */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle>{t("byDivision")}</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7">
              <Link href="/admin/locations">
                <MapPinned aria-hidden /> {tl("division")}
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {divisions.map((d) => (
                <li key={d.id} className="grid grid-cols-[96px_1fr_auto] items-center gap-2 text-xs">
                  <Link href={`/admin/locations?parent=${d.id}`} className="truncate font-medium hover:text-primary">
                    {localizedName(d, locale)}
                  </Link>
                  <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${(d.members / maxMembers) * 100}%` }}
                    />
                  </span>
                  <span className="tabular w-8 text-right text-muted-foreground">{d.members}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
              {(["district", "upazila", "union", "city_corporation", "thana", "area"] as const)
                .map((l) => `${(levels[l] ?? 0).toLocaleString("en-US")} ${tl(l)}`)
                .join(" · ")}
            </p>
          </CardContent>
        </Card>

        {/* Roles */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t("roles")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              {(["member", "host", "admin"] as const).map((r) => (
                <span
                  key={r}
                  className={cn("h-full", r === "member" ? "bg-primary" : r === "host" ? "bg-success" : "bg-info")}
                  style={{ width: `${((roles[r] ?? 0) / roleTotal) * 100}%` }}
                />
              ))}
            </div>
            <ul className="grid grid-cols-3 gap-2">
              {(["member", "host", "admin"] as const).map((r) => (
                <li key={r} className="rounded-lg border border-border px-2.5 py-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <span
                      className={cn("size-2 rounded-full", r === "member" ? "bg-primary" : r === "host" ? "bg-success" : "bg-info")}
                      aria-hidden
                    />
                    {tr(r)}
                  </p>
                  <p className="tabular text-lg font-semibold">{roles[r] ?? 0}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Recent signups */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t("recentSignups")}</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/users">
              {t("viewAll")} <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("user")}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("area")}</TableHead>
              <TableHead>{tu("role")}</TableHead>
              <TableHead>{tu("status")}</TableHead>
              <TableHead className="hidden text-right md:table-cell">{tu("joined")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSignups.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7">
                      {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                      <AvatarFallback className="text-[11px]">
                        {(user.name || "?").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Link href={`/profile/${user.id}`} className="truncate font-medium hover:underline">
                      {user.name || "—"}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{user.areaName ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "info" : user.role === "host" ? "success" : "outline"}>
                    {tr(user.role === "admin" || user.role === "host" ? user.role : "member")}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.status === "suspended" ? (
                    <Badge variant="destructive">{tu("suspended")}</Badge>
                  ) : user.onboardedAt ? (
                    <Badge variant="success">{tu("onboarded")}</Badge>
                  ) : (
                    <Badge variant="secondary">{tu("active")}</Badge>
                  )}
                </TableCell>
                <TableCell className="tabular hidden text-right text-xs text-muted-foreground md:table-cell">
                  {user.createdAt.toISOString().slice(0, 10)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
