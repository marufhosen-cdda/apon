import { getLocale, getTranslations } from "next-intl/server";
import { ChevronRight, MapPin, Search } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { requirePermission } from "@/lib/session";
import {
  getAdminLocationRows,
  getLocationLevelCounts,
  getLocationTrail,
  searchLocations,
} from "@/lib/queries/locations";
import { CHILD_LEVELS, LOCATION_LEVELS, isLocationLevel, localizedName } from "@/lib/geo/levels";
import { AdminPageHeader } from "@/components/features/admin/admin-page-header";
import {
  AddLocationDialog,
  LocationRowActions,
} from "@/components/features/admin/location-admin-controls";
import { EmptyState } from "@/components/features/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export async function generateMetadata() {
  const t = await getTranslations("admin.locations");
  return { title: t("title") };
}

interface Props {
  searchParams: Promise<{ parent?: string; q?: string }>;
}

export default async function AdminLocationsPage({ searchParams }: Props) {
  await requirePermission("admin.locations");
  const params = await searchParams;
  const parentId = Number(params.parent) > 0 ? Number(params.parent) : null;
  const query = (params.q ?? "").trim();

  const [t, tl, locale, counts, trail, rows, results] = await Promise.all([
    getTranslations("admin.locations"),
    getTranslations("locations.levels"),
    getLocale(),
    getLocationLevelCounts(),
    getLocationTrail(parentId),
    getAdminLocationRows(parentId),
    query.length >= 2 ? searchLocations(query, 20) : Promise.resolve(null),
  ]);

  const parent = trail.at(-1);
  const childLevels = parent && isLocationLevel(parent.level) ? CHILD_LEVELS[parent.level] : [];
  const total = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  return (
    <div className="space-y-5">
      <AdminPageHeader title={t("title")} subtitle={t("subtitle")}>
        {parent && childLevels.length > 0 ? (
          <AddLocationDialog
            parentId={parent.id}
            parentName={localizedName(parent, locale)}
            levels={[...childLevels]}
          />
        ) : null}
      </AdminPageHeader>

      {/* Coverage strip */}
      <section aria-label={t("coverage")} className="grid grid-cols-3 gap-2 sm:grid-cols-5 xl:grid-cols-10">
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
          <p className="text-[11px] font-medium text-muted-foreground">{t("coverage")}</p>
          <p className="tabular text-lg font-semibold">{total.toLocaleString("en-US")}</p>
        </div>
        {LOCATION_LEVELS.map((level) => (
          <div key={level} className="rounded-lg border border-border bg-card px-3 py-2 shadow-xs">
            <p className="truncate text-[11px] font-medium text-muted-foreground">{tl(level)}</p>
            <p className="tabular text-lg font-semibold">{(counts[level] ?? 0).toLocaleString("en-US")}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm">
          <Link
            href="/admin/locations"
            className={parent ? "text-muted-foreground hover:text-foreground" : "font-semibold"}
          >
            {t("allBangladesh")}
          </Link>
          {trail.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              <ChevronRight className="size-3.5 text-muted-foreground" aria-hidden />
              {i === trail.length - 1 ? (
                <span className="font-semibold">{localizedName(crumb, locale)}</span>
              ) : (
                <Link href={`/admin/locations?parent=${crumb.id}`} className="text-muted-foreground hover:text-foreground">
                  {localizedName(crumb, locale)}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <form className="relative w-full sm:w-72" action="">
          {parentId ? <input type="hidden" name="parent" value={parentId} /> : null}
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" defaultValue={query} placeholder={t("searchPlaceholder")} className="pl-8" />
        </form>
      </div>

      {results ? (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("results")}</h2>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((r) => (
              <Link
                key={r.id}
                href={`/admin/locations?parent=${r.childCount > 0 ? r.id : (r.trail.at(-2)?.id ?? "")}`}
                className="flex items-start gap-2 rounded-lg border border-border bg-card p-2.5 shadow-xs transition-colors hover:border-primary/40"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-medium">
                    <span className="truncate">{localizedName(r, locale)}</span>
                    <Badge variant="secondary">{tl(r.level)}</Badge>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {r.trail.slice(0, -1).reverse().map((c) => localizedName(c, locale)).join(", ")}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState icon={MapPin} title={childLevels.length ? t("empty") : t("noChildrenAllowed")} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("level")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("zone")}</TableHead>
              <TableHead className="text-right">{t("inside")}</TableHead>
              <TableHead className="text-right">{t("members")}</TableHead>
              <TableHead className="hidden text-right sm:table-cell">{t("venues")}</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">{t("status")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className={row.isActive ? undefined : "opacity-60"}>
                <TableCell>
                  <Link
                    href={`/admin/locations?parent=${row.id}`}
                    className="group flex flex-col"
                  >
                    <span className="font-medium group-hover:text-primary">
                      {locale === "bn" ? row.nameBn : row.nameEn}
                    </span>
                    <span className="text-xs text-muted-foreground">{locale === "bn" ? row.nameEn : row.nameBn}</span>
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary">{tl(row.level)}</Badge>
                    {!row.isActive ? <Badge variant="warning">{t("hidden")}</Badge> : null}
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-56 truncate text-xs text-muted-foreground md:table-cell">
                  {row.zoneLabelEn}
                </TableCell>
                <TableCell className="tabular text-right">{row.childCount.toLocaleString("en-US")}</TableCell>
                <TableCell className="tabular text-right">{row.members}</TableCell>
                <TableCell className="tabular hidden text-right sm:table-cell">{row.venues}</TableCell>
                <TableCell>
                  <LocationRowActions id={row.id} nameEn={row.nameEn} nameBn={row.nameBn} isActive={row.isActive} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
