import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, CalendarCheck, CalendarClock, EyeOff, MessagesSquare, Users, Vote } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/lib/session";
import { getAdminCircleDetail } from "@/lib/queries/circles";
import { formatDate, formatDateTime } from "@/lib/dates";
import { AdminPageHeader } from "@/components/features/admin/admin-page-header";
import { StatTile } from "@/components/features/shared/stat-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("admin.circles");
  const { id } = await params;
  return { title: `${t("title")} #${id}` };
}

const STATUS_VARIANT = { active: "success", invited: "info", left: "secondary", declined: "outline" } as const;

/**
 * Admin circle detail. Separate from the member page (`/circles/[id]`), which
 * stays private to the circle's own members.
 */
export default async function AdminCircleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const circleId = Number(id);
  if (!Number.isInteger(circleId) || circleId <= 0) notFound();

  const [t, locale, detail] = await Promise.all([
    getTranslations("admin.circles"),
    getLocale(),
    getAdminCircleDetail(circleId),
  ]);
  if (!detail) notFound();

  const { circle, zoneLabel, members, upcoming, poll, chat } = detail;
  const active = members.filter((m) => m.membership.status === "active").length;
  const statusLabel =
    circle.status === "active" ? t("statusActive") : circle.status === "archived" ? t("statusArchived") : t("statusForming");
  const totalVotes = poll?.options.reduce((sum, o) => sum + o.votes, 0) ?? 0;

  return (
    <div className="space-y-5">
      <Link href="/admin/circles" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> {t("back")}
      </Link>

      <AdminPageHeader
        title={circle.name}
        subtitle={[
          zoneLabel ? (locale === "bn" ? zoneLabel.bn : zoneLabel.en) : circle.zone,
          `${t("createdBy")}: ${circle.createdBy === "system" ? t("system") : circle.createdBy}`,
          `${t("created")}: ${formatDate(circle.createdAt, locale)}`,
        ].join(" · ")}
      >
        <Badge variant={circle.status === "active" ? "success" : "secondary"}>{statusLabel}</Badge>
        {circle.womenOnly ? <Badge variant="info">{t("womenOnly")}</Badge> : null}
      </AdminPageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Users} label={t("members")} value={members.length} hint={t("activeMembers", { count: active })} />
        <StatTile icon={CalendarClock} label={t("upcoming")} value={upcoming.length} />
        <StatTile icon={MessagesSquare} label={t("messages")} value={chat.total} hint={chat.hidden ? `${chat.hidden} ${t("hidden").toLowerCase()}` : undefined} />
        <StatTile
          icon={CalendarCheck}
          label={t("matchedOn")}
          value={circle.matchedAt ? formatDate(circle.matchedAt, locale) : t("never")}
          small
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <section className="space-y-2 xl:col-span-2">
          <h2 className="text-sm font-semibold">{t("members")}</h2>
          {members.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t("noMembers")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("member")}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t("area")}</TableHead>
                  <TableHead>{t("memberStatus")}</TableHead>
                  <TableHead className="hidden text-right md:table-cell">{t("joined")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(({ membership, user, areaName, areaNameBn }) => (
                  <TableRow key={membership.id}>
                    <TableCell>
                      <Link href={`/profile/${user.id}`} className="group flex items-center gap-2.5" title={t("viewProfile")}>
                        <Avatar className="size-7">
                          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                          <AvatarFallback className="text-[11px]">{(user.name || "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate font-medium group-hover:underline">{user.name}</span>
                          {user.username ? <span className="block truncate text-xs text-muted-foreground">@{user.username}</span> : null}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {(locale === "bn" ? areaNameBn : areaName) ?? "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant={STATUS_VARIANT[membership.status as keyof typeof STATUS_VARIANT] ?? "outline"}>
                          {t(`memberStatuses.${membership.status}` as "memberStatuses.active")}
                        </Badge>
                        {user.status === "suspended" ? <Badge variant="destructive">suspended</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="tabular hidden text-right text-xs text-muted-foreground md:table-cell">
                      {membership.joinedAt ? formatDate(membership.joinedAt, locale) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>

        <aside className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" aria-hidden /> {t("upcoming")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noUpcoming")}</p>
              ) : (
                <ul className="space-y-2">
                  {upcoming.map(({ activity, venueName }) => (
                    <li key={activity.id} className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
                      <Link href={`/activities/${activity.id}`} className="font-medium hover:underline">
                        {activity.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(activity.startsAt, locale)}
                        {venueName ? ` · ${venueName}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Vote className="size-4 text-primary" aria-hidden /> {t("poll")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!poll ? (
                <p className="text-sm text-muted-foreground">{t("noPoll")}</p>
              ) : (
                <ul className="space-y-2">
                  <li className="text-xs text-muted-foreground">
                    {poll.poll.title} <Badge variant="outline" className="ml-1">{poll.poll.status}</Badge>
                  </li>
                  {poll.options.map((option) => (
                    <li key={option.id} className="text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{option.label}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{t("votes", { count: option.votes })}</span>
                      </div>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                        <span
                          className="block h-full rounded-full bg-primary"
                          style={{ width: `${totalVotes ? (option.votes / totalVotes) * 100 : 0}%` }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <MessagesSquare className="size-4 text-primary" aria-hidden /> {t("chat")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex justify-between"><span className="text-muted-foreground">{t("messages")}</span><span className="tabular font-medium">{chat.total}</span></p>
              <p className="flex justify-between"><span className="text-muted-foreground">{t("hidden")}</span><span className="tabular font-medium">{chat.hidden}</span></p>
              <p className="flex justify-between"><span className="text-muted-foreground">{t("lastMessage")}</span><span className="font-medium">{chat.lastAt ? formatDateTime(chat.lastAt, locale) : t("never")}</span></p>
              <p className="flex items-start gap-1.5 border-t border-border pt-2 text-xs text-muted-foreground">
                <EyeOff className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {t("privacy")}
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
