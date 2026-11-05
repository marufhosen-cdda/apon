import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Clock, MapPin, Users } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { activityCover } from "@/lib/images";
import { formatDateTime } from "@/lib/dates";
import { BLUR_DATA_URL, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LayoutCard } from "@/components/motion";

export interface ActivityCardData {
  id: number;
  title: string;
  startsAt: Date;
  costBdt: number;
  capacity: number;
  womenOnly: boolean;
  status: string;
  imageUrl?: string | null;
  areaName?: string | null;
  venueName?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  goingCount?: number;
}

/** Grid card for the activities board and home suggestions. */
export async function ActivityCard({
  activity,
  locale,
  layoutId,
  className,
}: {
  activity: ActivityCardData;
  locale: string;
  layoutId?: string;
  className?: string;
}) {
  const t = await getTranslations("activities");
  const cover = activityCover(activity.categorySlug ?? undefined);
  const spotsLeft = Math.max(0, activity.capacity - (activity.goingCount ?? 0));

  return (
    <LayoutCard
      id={layoutId ?? `activity-${activity.id}`}
      className={cn("h-full", className)}
    >
      <Link
        href={`/activities/${activity.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
      >
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/25 via-primary/10 to-muted">
          <Image
            src={activity.imageUrl ?? cover.src}
            alt={cover.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" aria-hidden />
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
            {activity.status === "pending" ? (
              <Badge variant="warning" className="bg-card/95">{t("detail.pending")}</Badge>
            ) : null}
            {activity.womenOnly ? (
              <Badge variant="secondary" className="bg-card/95">{t("filters.womenOnly")}</Badge>
            ) : null}
          </div>
          <span className="absolute right-2.5 top-2.5 rounded-md bg-card/95 px-1.5 py-0.5 text-[11px] font-semibold text-foreground shadow-xs">
            {activity.costBdt === 0 ? t("filters.free") : `৳ ${activity.costBdt}`}
          </span>
          {activity.categoryName ? (
            <p className="absolute bottom-2 left-2.5 text-[11px] font-semibold uppercase tracking-wide text-white drop-shadow">
              {activity.categoryName}
            </p>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
            {activity.title}
          </h3>

          <div className="mt-auto grid gap-1 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5">
              <Clock className="size-3.5 shrink-0" aria-hidden />
              {formatDateTime(activity.startsAt, locale)}
            </p>
            <div className="flex items-center justify-between gap-2">
              <p className="flex min-w-0 items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{activity.areaName ?? activity.venueName ?? "—"}</span>
              </p>
              <p
                className={cn(
                  "flex shrink-0 items-center gap-1",
                  spotsLeft > 0 && spotsLeft <= 3 ? "font-medium text-warning" : undefined,
                )}
              >
                <Users className="size-3.5" aria-hidden />
                {spotsLeft > 0 ? t("detail.spotsLeft", { count: spotsLeft }) : t("detail.full")}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </LayoutCard>
  );
}

/** Dense list row (home "upcoming", side panels): date tile + title + meta. */
export async function ActivityRow({ activity, locale }: { activity: ActivityCardData; locale: string }) {
  const t = await getTranslations("activities");
  const date = new Date(activity.startsAt);
  const month = date.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { month: "short", timeZone: "Asia/Dhaka" });
  const day = date.toLocaleDateString(locale === "bn" ? "bn-BD" : "en-GB", { day: "numeric", timeZone: "Asia/Dhaka" });

  return (
    <Link
      href={`/activities/${activity.id}`}
      className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/70"
    >
      <span className="grid w-11 shrink-0 place-items-center rounded-lg border border-border bg-card py-1 text-center leading-none shadow-xs">
        <span className="text-[10px] font-semibold uppercase text-primary">{month}</span>
        <span className="mt-0.5 text-base font-semibold">{day}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium group-hover:text-primary">{activity.title}</span>
        <span className="flex items-center gap-2 truncate text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden />
            {formatDateTime(activity.startsAt, locale)}
          </span>
          {activity.areaName ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{activity.areaName}</span>
            </span>
          ) : null}
        </span>
      </span>
      <Badge variant={activity.costBdt === 0 ? "success" : "outline"} className="shrink-0">
        {activity.costBdt === 0 ? t("filters.free") : `৳ ${activity.costBdt}`}
      </Badge>
    </Link>
  );
}
