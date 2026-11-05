import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { requireOnboarded } from "@/lib/session";
import { getInterests } from "@/lib/queries/reference";
import { getLocationBySlug, getLocationTrail } from "@/lib/queries/locations";
import { formatTrail } from "@/lib/geo/levels";
import { listActivities } from "@/lib/queries/activities";
import { PageHeader } from "@/components/features/shared/page-header";
import { EmptyState } from "@/components/features/shared/empty-state";
import { ActivityCard } from "@/components/features/activities/activity-card";
import { ActivityFilters } from "@/components/features/activities/activity-filters";
import { Pagination } from "@/components/features/shared/pagination";
import { Stagger, StaggerItem } from "@/components/motion";

export const metadata: Metadata = { title: "Activities" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    category?: string;
    area?: string;
    date?: string;
    price?: string;
    womenOnly?: string;
    page?: string;
  }>;
}

export default async function ActivitiesPage({ searchParams }: Props) {
  const user = await requireOnboarded();
  const [t, params, interests] = await Promise.all([
    getTranslations("activities"),
    searchParams,
    getInterests(),
  ]);
  const picked = params.area ? await getLocationBySlug(params.area) : null;
  const areaTrail = await getLocationTrail(picked?.id);

  const filters = {
    category: params.category || undefined,
    area: params.area || undefined,
    date: (params.date as "any" | "week" | "month") || "any",
    price: (params.price as "any" | "free" | "paid") || "any",
    womenOnly: params.womenOnly === "true",
    page: Number(params.page) || 1,
  };

  const result = await listActivities(filters);

  return (
    <div className="space-y-4">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <ActivityFilters interests={interests} areaTrail={areaTrail} />

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-xs">
            <p className="font-medium" aria-live="polite">
              {t("filters.results", { count: result.total })}
            </p>
            {areaTrail.length ? (
              <p className="truncate text-xs text-muted-foreground">{formatTrail(areaTrail, user.locale, 3)}</p>
            ) : null}
          </div>

          {result.items.length === 0 ? (
            <EmptyState
              title={t("filters.noResults")}
              text={t("filters.noResultsText")}
              actionLabel={t("filters.clearFilters")}
              actionHref="/activities"
            />
          ) : (
            <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((activity) => (
                <StaggerItem key={activity.id}>
                  <ActivityCard activity={activity} locale={user.locale} />
                </StaggerItem>
              ))}
            </Stagger>
          )}

          <Pagination page={result.page} pageCount={result.pageCount} />
        </div>
      </div>
    </div>
  );
}
