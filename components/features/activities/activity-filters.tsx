"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { MapPin, SlidersHorizontal, X } from "lucide-react";

import type { getInterests } from "@/lib/queries/reference";
import type { LocationCrumb } from "@/lib/geo/levels";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { LocationPicker } from "@/components/features/locations/location-picker";

/**
 * Board filters — all state lives in the URL (nuqs, `shallow: false`), so
 * results are shareable and the server page re-queries on every change.
 * The location filter covers any level: picking "Chattogram division"
 * returns everything inside it.
 */
export function ActivityFilters({
  interests,
  areaTrail,
}: {
  interests: Awaited<ReturnType<typeof getInterests>>;
  areaTrail: LocationCrumb[];
}) {
  const t = useTranslations("activities.filters");
  const tc = useTranslations("common");
  const tl = useTranslations("locations");
  const locale = useLocale();
  const [resetKey, setResetKey] = useState(0);
  const [filters, setFilters] = useQueryStates(
    {
      category: parseAsString.withDefault(""),
      area: parseAsString.withDefault(""),
      date: parseAsString.withDefault("any"),
      price: parseAsString.withDefault("any"),
      womenOnly: parseAsBoolean.withDefault(false),
      page: parseAsInteger.withDefault(1),
    },
    { shallow: false },
  );

  const isFiltered =
    filters.category !== "" ||
    filters.area !== "" ||
    filters.date !== "any" ||
    filters.price !== "any" ||
    filters.womenOnly;

  return (
    <section
      className="border-border bg-card rounded-xl border shadow-xs"
      aria-label={tc("filters")}
    >
      <div className="border-border flex items-center justify-between gap-2 border-b px-3.5 py-2">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="text-primary size-4" aria-hidden />
          {tc("filters")}
        </p>
        {isFiltered ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={() => {
              setResetKey((k) => k + 1);
              void setFilters({
                category: "",
                area: "",
                date: "any",
                price: "any",
                womenOnly: false,
                page: 1,
              });
            }}
          >
            <X aria-hidden /> {t("clearFilters")}
          </Button>
        ) : null}
      </div>

      <div className="space-y-3 p-3.5">
        <div className="grid gap-2.5 sm:grid-cols-3">
          <label className="space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("category")}
            </span>
            <NativeSelect
              value={filters.category}
              onChange={(e) => setFilters({ category: e.target.value, page: 1 })}
            >
              <option value="">{tc("all")}</option>
              {interests.map((interest) => (
                <option key={interest.id} value={interest.slug}>
                  {locale === "bn" ? interest.nameBn : interest.nameEn}
                </option>
              ))}
            </NativeSelect>
          </label>

          <label className="space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("date")}
            </span>
            <NativeSelect
              value={filters.date}
              onChange={(e) =>
                setFilters({ date: e.target.value as "any" | "week" | "month", page: 1 })
              }
            >
              <option value="any">{t("anyDate")}</option>
              <option value="week">{t("thisWeek")}</option>
              <option value="month">{t("thisMonth")}</option>
            </NativeSelect>
          </label>

          <label className="space-y-1">
            <span className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
              {t("price")}
            </span>
            <NativeSelect
              value={filters.price}
              onChange={(e) =>
                setFilters({ price: e.target.value as "any" | "free" | "paid", page: 1 })
              }
            >
              <option value="any">{t("anyPrice")}</option>
              <option value="free">{t("free")}</option>
              <option value="paid">{t("paid")}</option>
            </NativeSelect>
          </label>
        </div>

        <div className="space-y-1.5">
          <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
            <MapPin className="size-3.5" aria-hidden />
            {tl("location")}
            {filters.area === "" ? (
              <span className="tracking-normal normal-case">· {tl("anywhere")}</span>
            ) : null}
          </p>
          <LocationPicker
            key={resetKey}
            initialTrail={resetKey === 0 ? areaTrail : []}
            allowDivision
            onChange={(_id, trail) =>
              setFilters({ area: trail.at(-1)?.slug ?? "", page: 1 })
            }
          />
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={filters.womenOnly}
            onChange={(e) => setFilters({ womenOnly: e.target.checked, page: 1 })}
            className="border-input size-4 rounded accent-[var(--primary)]"
          />
          {t("womenOnly")}
        </label>
      </div>
    </section>
  );
}
