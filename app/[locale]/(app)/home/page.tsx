import { getTranslations } from "next-intl/server";
import {
  ArrowRight,
  CalendarCheck,
  CalendarPlus,
  MapPin,
  Plus,
  Sparkles,
  Users,
  Waypoints,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { requireOnboarded } from "@/lib/session";
import { can } from "@/lib/rbac";
import { getMyCircle } from "@/lib/queries/circles";
import { getMyRsvps, getPendingFeedback, getSuggestedActivities } from "@/lib/queries/activities";
import { getLocationById, getLocationTrail } from "@/lib/queries/locations";
import { formatTrail } from "@/lib/geo/levels";
import { EmptyState } from "@/components/features/shared/empty-state";
import { ActivityCard, ActivityRow } from "@/components/features/activities/activity-card";
import { StatTile } from "@/components/features/shared/stat-tile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stagger, StaggerItem, FadeUp } from "@/components/motion";
import { formatDateTime } from "@/lib/dates";

export const metadata = { title: "Home" };

export default async function HomePage() {
  const user = await requireOnboarded();
  const locale = user.locale;

  const [t, tc, circle, upcoming, suggested, pendingFeedback, trail, area] = await Promise.all([
    getTranslations("home"),
    getTranslations("common"),
    getMyCircle(user.id),
    getMyRsvps(user.id),
    getSuggestedActivities(user.id, user.areaId, 6),
    getPendingFeedback(user.id),
    getLocationTrail(user.areaId),
    user.areaId ? getLocationById(user.areaId) : Promise.resolve(null),
  ]);

  const now = new Date();
  const nextUp = upcoming.filter((r) => r.activity.startsAt > now).slice(0, 5);
  const pastUp = upcoming.filter((r) => r.activity.startsAt <= now).slice(-3);
  const zoneLabel = area ? (locale === "bn" ? area.zoneLabelBn : area.zoneLabelEn) : "—";

  return (
    <div className="space-y-5">
      {/* --------------------------------------------------------- Header */}
      <FadeUp className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {t("greeting", { name: user.name.split(" ")[0] })}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/activities">
              <CalendarPlus aria-hidden /> {t("browse")}
            </Link>
          </Button>
          {can(user.role, "activities.host") ? (
            <Button asChild size="sm">
              <Link href="/host/new">
                <Plus aria-hidden /> {t("hostNew")}
              </Link>
            </Button>
          ) : null}
        </div>
      </FadeUp>

      {/* ---------------------------------------------------------- Stats */}
      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StaggerItem>
          <StatTile icon={CalendarCheck} label={t("statUpcoming")} value={nextUp.length} href="/activities" />
        </StaggerItem>
        <StaggerItem>
          <StatTile
            icon={Users}
            label={t("statCircle")}
            value={circle?.members.length ?? 0}
            href={circle ? `/circles/${circle.circle.id}` : "/circles"}
          />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon={Sparkles} label={t("statSuggested")} value={suggested.length} href="/activities" />
        </StaggerItem>
        <StaggerItem>
          <StatTile icon={Waypoints} label={t("statZone")} value={zoneLabel} small href="/settings#profile" />
        </StaggerItem>
      </Stagger>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ------------------------------------------------- Main column */}
        <div className="min-w-0 space-y-5 lg:col-span-2">
          {pendingFeedback.length > 0 ? (
            <FadeUp>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 size-4 text-primary" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">{t("feedbackPrompt")}</p>
                    <p className="text-xs text-muted-foreground">{t("feedbackPromptText")}</p>
                  </div>
                </div>
                <Button asChild size="sm">
                  <Link href={`/activities/${pendingFeedback[0].activity.id}?feedback=1`}>
                    {t("feedbackCta")}
                  </Link>
                </Button>
              </div>
            </FadeUp>
          ) : null}

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <CalendarCheck className="size-4 text-primary" aria-hidden />
                {t("upcoming")}
              </CardTitle>
              <Badge variant="secondary">{nextUp.length}</Badge>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              {nextUp.length === 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-3">
                  <p className="text-sm text-muted-foreground">{t("upcomingEmpty")}</p>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/activities">{t("browse")}</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {nextUp.map((row) => (
                    <ActivityRow
                      key={row.rsvp.id}
                      locale={locale}
                      activity={{
                        id: row.activity.id,
                        title: row.activity.title,
                        startsAt: row.activity.startsAt,
                        costBdt: row.activity.costBdt,
                        capacity: row.activity.capacity,
                        womenOnly: row.activity.womenOnly,
                        status: row.activity.status,
                        areaName: row.areaName,
                        venueName: row.venueName,
                      }}
                    />
                  ))}
                </div>
              )}
              {pastUp.length > 0 ? (
                <p className="mt-1 border-t border-border px-2 pt-2 text-xs text-muted-foreground">
                  <span className="font-medium">{t("pastRecent")}:</span>{" "}
                  {pastUp.map((r) => r.activity.title).join(" · ")}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <section>
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <CalendarPlus className="size-4 text-primary" aria-hidden />
                {t("suggested")}
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/activities">
                  {tc("seeAll")} <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>

            {suggested.length === 0 ? (
              <EmptyState title={t("suggestedEmpty")} actionLabel={tc("seeAll")} actionHref="/activities" />
            ) : (
              <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {suggested.map((row) => (
                  <StaggerItem key={row.activity.id}>
                    <ActivityCard
                      activity={{
                        id: row.activity.id,
                        title: row.activity.title,
                        startsAt: row.activity.startsAt,
                        costBdt: row.activity.costBdt,
                        capacity: row.activity.capacity,
                        womenOnly: row.activity.womenOnly,
                        status: row.activity.status,
                        areaName: row.areaName,
                        categorySlug: row.categorySlug,
                        categoryName: row.categoryName,
                        goingCount: row.goingCount,
                      }}
                      locale={locale}
                    />
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </section>
        </div>

        {/* ------------------------------------------------------- Aside */}
        <aside className="order-first min-w-0 space-y-5 lg:order-none">
          {circle ? (
            <Card className="overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="truncate">{circle.circle.name}</CardTitle>
                  <Badge variant={circle.circle.status === "active" ? "success" : "secondary"}>
                    {circle.circle.status === "active" ? t("yourCircle") : t("formingTitle")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("members", { count: circle.members.length })}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex -space-x-2">
                  {circle.members.slice(0, 6).map((m) => (
                    <Avatar key={m.user.id} className="size-8 border-2 border-card">
                      {m.user.avatarUrl ? <AvatarImage src={m.user.avatarUrl} alt="" /> : null}
                      <AvatarFallback className="text-xs">{m.user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs">
                  <p className="font-medium text-foreground">{t("nextMeetup")}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {circle.nextActivities.length
                      ? `${circle.nextActivities[0].activity.title} · ${formatDateTime(circle.nextActivities[0].activity.startsAt, locale)}`
                      : t("noMeetupYet")}
                  </p>
                  {circle.poll ? (
                    <Badge variant="outline" className="mt-1.5">
                      {circle.poll.poll.status === "open" ? t("pollOpen") : t("pollClosed")}
                    </Badge>
                  ) : null}
                </div>
                <Button asChild size="sm" className="w-full">
                  <Link href={`/circles/${circle.circle.id}`}>
                    {t("viewCircle")} <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>{t("formingTitle")}</CardTitle>
                <p className="text-xs text-muted-foreground">{t("formingText")}</p>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t("formingHint")}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" aria-hidden />
                {t("yourArea")}
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7">
                <Link href="/settings#profile">{t("changeArea")}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {trail.length ? (
                <>
                  <p className="text-sm font-medium">{formatTrail(trail, locale, 2)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{formatTrail(trail.slice(0, -2), locale, 3)}</p>
                  <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-accent-foreground">
                    <Waypoints className="size-3" aria-hidden />
                    {zoneLabel}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">{t("noArea")}</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
