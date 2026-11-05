import type { LucideIcon } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** Compact KPI tile used on the member home and the admin overview. */
export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  href,
  small = false,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  /** Text values (e.g. a zone name) render smaller than numbers. */
  small?: boolean;
  tone?: "default" | "warning" | "info" | "success";
}) {
  const toneClass = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
    success: "bg-success/10 text-success",
  }[tone];

  const body = (
    <div className="flex h-full items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3 shadow-xs transition-colors group-hover:border-primary/40">
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", toneClass)}>
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs text-muted-foreground">
          {label}
        </span>
        <span className={cn("tabular block truncate font-semibold", small ? "text-sm" : "text-xl leading-tight")}>
          {typeof value === "number" ? value.toLocaleString("en-US") : value}
        </span>
        {hint ? <span className="block truncate text-[11px] text-muted-foreground">{hint}</span> : null}
      </span>
    </div>
  );

  return href ? (
    <Link href={href} className="group block h-full">
      {body}
    </Link>
  ) : (
    <div className="group h-full">{body}</div>
  );
}
