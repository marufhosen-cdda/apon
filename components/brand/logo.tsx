import { cn } from "@/lib/utils";

/**
 * APON brand mark — an open ring (the circle) with a warm dot sitting in its
 * gap: there is always a place for you. "Everyone belongs."
 *
 * Geometry is shared with `app/icon.svg`, `public/brand/*.svg` and
 * `scripts/generate-icons.mjs` (which rasterises the PWA icons and favicon).
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 512 512"
      className={cn("size-7 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="512" height="512" rx="118" fill="var(--brand-tile, #0f766e)" />
      <g transform="translate(256 256) scale(0.88) translate(-256 -256)">
        <path
          d="M400.77 225.23A148 148 0 1 1 261.17 108.09"
          fill="none"
          stroke="#ffffff"
          strokeWidth="58"
          strokeLinecap="round"
        />
        <circle cx="351.13" cy="142.63" r="46" fill="var(--brand-accent, #fbbf24)" />
      </g>
    </svg>
  );
}

/** Mark + "APON" wordmark (+ optional tagline). */
export function Logo({
  className,
  markClassName,
  tagline,
  hideWordmarkOnMobile = false,
  tone = "default",
}: {
  className?: string;
  markClassName?: string;
  /** e.g. "Everyone belongs" or the admin console label. */
  tagline?: string;
  hideWordmarkOnMobile?: boolean;
  /** "inverse" for dark surfaces such as the admin sidebar. */
  tone?: "default" | "inverse";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={markClassName} />
      <span className={cn("leading-none", hideWordmarkOnMobile && "hidden sm:block")}>
        <span
          className={cn(
            "block text-[15px] font-extrabold tracking-[0.14em]",
            tone === "inverse" ? "text-white" : "text-foreground",
          )}
        >
          APON
        </span>
        {tagline ? (
          <span
            className={cn(
              "mt-0.5 block text-[10px] font-medium tracking-wide",
              tone === "inverse" ? "text-sidebar-muted" : "text-muted-foreground",
            )}
          >
            {tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}
