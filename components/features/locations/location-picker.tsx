"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, Loader2, MapPin, Search, X } from "lucide-react";

import { findLocations, loadLocationChildren } from "@/lib/actions/locations";
import {
  type LocationCrumb,
  type LocationLevel,
  type LocationOption,
  type LocationSearchResult,
  localizedName,
} from "@/lib/geo/levels";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

/**
 * Cascading Bangladesh location picker.
 *
 *   Division → District → City corporation / Upazila → Thana / Union / Ward → Area / Village
 *
 * Loads one level at a time through server actions (the full tree is ~6k
 * rows), and offers a name search across every level for people who know
 * exactly where they are ("Gulshan 2", "Savar", "আগ্রাবাদ").
 */

const childCache = new Map<string, Promise<LocationOption[]>>();

function loadChildren(parentId: number | null) {
  const key = String(parentId ?? "root");
  let pending = childCache.get(key);
  if (!pending) {
    pending = loadLocationChildren(parentId).catch((err) => {
      childCache.delete(key);
      throw err;
    });
    childCache.set(key, pending);
  }
  return pending;
}

export interface LocationPickerProps {
  /** Root-first trail of the current value (empty when nothing is picked). */
  initialTrail?: LocationCrumb[];
  onChange: (id: number | null, trail: LocationCrumb[]) => void;
  /** Filters may stop at a division; profile/venue locations may not. */
  allowDivision?: boolean;
  /** Hide the search box (e.g. in tight filter bars). */
  hideSearch?: boolean;
  /** Lay the selects out in a responsive grid instead of a stack. */
  layout?: "stack" | "grid" | "sidebar";
  className?: string;
}

export function LocationPicker({
  initialTrail = [],
  onChange,
  allowDivision = false,
  hideSearch = false,
  layout = "grid",
  className,
}: LocationPickerProps) {
  const t = useTranslations("locations");
  const locale = useLocale();
  const baseId = useId();

  const [path, setPath] = useState<LocationCrumb[]>(initialTrail);
  /** options[i] = children of path[i - 1] (options[0] = divisions). */
  const [options, setOptions] = useState<Record<string, LocationOption[]>>({});

  const ensure = useCallback(async (parentId: number | null) => {
    const key = String(parentId ?? "root");
    const rows = await loadChildren(parentId).catch(() => [] as LocationOption[]);
    setOptions((o) => (o[key] ? o : { ...o, [key]: rows }));
  }, []);

  // Load the root plus every level along the initial trail.
  const [initial] = useState(initialTrail);
  useEffect(() => {
    let alive = true;
    const parents = [null, ...initial.map((c) => c.id)];
    Promise.all(
      parents.map((p) =>
        loadChildren(p).then((rows) => [String(p ?? "root"), rows] as const),
      ),
    )
      .then((entries) => {
        if (alive) setOptions((o) => ({ ...Object.fromEntries(entries), ...o }));
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [initial]);

  const commit = useCallback(
    (next: LocationCrumb[]) => {
      setPath(next);
      const last = next.at(-1);
      if (last) void ensure(last.id);
      const valid = next.filter((c) => allowDivision || c.level !== "division");
      onChange(valid.at(-1)?.id ?? null, next);
    },
    [allowDivision, ensure, onChange],
  );

  /** One select per selected crumb, plus one for the next level down. */
  const columns = useMemo(() => {
    const cols: { parentKey: string; selected: LocationCrumb | undefined }[] = [];
    for (let i = 0; i <= path.length; i++) {
      const parentKey = i === 0 ? "root" : String(path[i - 1].id);
      const rows = options[parentKey];
      if (i > 0 && rows && rows.length === 0) break; // leaf reached
      cols.push({ parentKey, selected: path[i] });
    }
    return cols;
  }, [path, options]);

  const levelLabel = (rows: LocationOption[] | undefined, fallbackDepth: number) => {
    const levels = [...new Set((rows ?? []).map((r) => r.level))] as LocationLevel[];
    if (levels.length === 0)
      return fallbackDepth === 0 ? t("levels.division") : t("narrowDown");
    return levels.map((l) => t(`levels.${l}`)).join(" / ");
  };

  return (
    <div className={cn("space-y-3", className)}>
      {!hideSearch ? <LocationSearch onPick={(trail) => commit(trail)} /> : null}

      <div
        className={cn(
          layout === "grid"
            ? "grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
            : "space-y-2.5",
        )}
      >
        {columns.map((col, i) => {
          const rows = options[col.parentKey];
          const id = `${baseId}-${i}`;
          const isLoading = !rows;
          return (
            <label key={col.parentKey} htmlFor={id} className="block space-y-1">
              <span className="text-muted-foreground flex items-center gap-1 text-[11px] font-medium tracking-wide uppercase">
                {levelLabel(rows, i)}
                {isLoading ? (
                  <Loader2 className="size-3 animate-spin" aria-hidden />
                ) : null}
              </span>
              <NativeSelect
                id={id}
                value={col.selected ? String(col.selected.id) : ""}
                disabled={!rows}
                onChange={(e) => {
                  const picked = rows?.find((r) => String(r.id) === e.target.value);
                  const base = path.slice(0, i);
                  commit(
                    picked
                      ? [
                          ...base,
                          {
                            id: picked.id,
                            slug: picked.slug,
                            level: picked.level,
                            nameEn: picked.nameEn,
                            nameBn: picked.nameBn,
                          },
                        ]
                      : base,
                  );
                }}
              >
                <option value="">{i === 0 ? t("chooseDivision") : t("any")}</option>
                {(rows ?? []).map((row) => (
                  <option key={row.id} value={row.id}>
                    {localizedName(row, locale)}
                    {row.childCount > 0 && i > 1 ? " ›" : ""}
                  </option>
                ))}
              </NativeSelect>
            </label>
          );
        })}
      </div>

      {path.length > 0 ? (
        <div className="bg-muted/60 flex flex-wrap items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs">
          <MapPin className="text-primary size-3.5 shrink-0" aria-hidden />
          {path.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              {i > 0 ? (
                <ChevronRight className="text-muted-foreground size-3" aria-hidden />
              ) : null}
              <button
                type="button"
                className={cn(
                  "hover:text-primary rounded px-0.5",
                  i === path.length - 1
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground",
                )}
                onClick={() => commit(path.slice(0, i + 1))}
              >
                {localizedName(crumb, locale)}
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => commit([])}
            className="text-muted-foreground hover:text-foreground ml-auto inline-flex items-center gap-0.5"
          >
            <X className="size-3" aria-hidden />
            {t("clear")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function LocationSearch({ onPick }: { onPick: (trail: LocationCrumb[]) => void }) {
  const t = useTranslations("locations");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationSearchResult[] | null>(null);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const listId = useId();

  useEffect(() => () => clearTimeout(timer.current), []);

  function onInput(value: string) {
    setQuery(value);
    clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    timer.current = setTimeout(() => {
      startTransition(async () => setResults(await findLocations(value)));
    }, 250);
  }

  return (
    <div className="relative">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(e) => onInput(e.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("searchPlaceholder")}
        aria-controls={listId}
        className="border-input bg-card focus-visible:border-ring h-10 w-full rounded-xl border pr-9 pl-9 text-sm shadow-sm focus-visible:outline-none"
      />
      {pending ? (
        <Loader2
          className="text-muted-foreground absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
          aria-hidden
        />
      ) : null}
      {results ? (
        <ul
          id={listId}
          role="listbox"
          className="border-border bg-popover absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-auto rounded-xl border p-1 shadow-lg"
        >
          {results.length === 0 ? (
            <li className="text-muted-foreground px-3 py-2 text-sm">{t("noResults")}</li>
          ) : (
            results.map((r) => (
              <li key={r.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="hover:bg-accent flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left"
                  onClick={() => {
                    onPick(r.trail);
                    setQuery("");
                    setResults(null);
                  }}
                >
                  <MapPin className="text-primary mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {localizedName(r, locale)}
                      <span className="text-muted-foreground ml-1.5 text-[11px] font-normal">
                        {t(`levels.${r.level}`)}
                      </span>
                    </span>
                    <span className="text-muted-foreground block truncate text-xs">
                      {r.trail
                        .slice(0, -1)
                        .reverse()
                        .map((c) => localizedName(c, locale))
                        .join(", ")}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
