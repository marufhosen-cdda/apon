"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";

import { acceptFor, type UploadPurpose } from "@/lib/uploads/policy";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUpload } from "./use-upload";
import { useUploadsEnabled } from "./uploads-context";

/**
 * Image picker that uploads straight to Cloudinary (via the server) and hands
 * back the CDN URL. Used for avatars, activity covers and venue photos.
 */
export function ImageUpload({
  purpose,
  value,
  onChange,
  label,
  shape = "wide",
  className,
}: {
  purpose: Extract<UploadPurpose, "avatar" | "activity_cover" | "venue_photo">;
  value: string;
  onChange: (url: string) => void;
  label: string;
  shape?: "circle" | "wide";
  className?: string;
}) {
  const t = useTranslations("uploads");
  const enabled = useUploadsEnabled();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { upload, pending, error, size } = useUpload(purpose);

  async function handle(file: File | undefined) {
    if (!file) return;
    const result = await upload(file);
    if (result) onChange(result.url);
    if (input.current) input.current.value = "";
  }

  const preview = (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden border border-border bg-muted text-muted-foreground",
        shape === "circle" ? "size-20 rounded-full" : "aspect-[16/9] w-full max-w-sm rounded-lg",
      )}
    >
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element -- user upload preview (any Cloudinary size)
        <img src={value} alt="" className="size-full object-cover" />
      ) : (
        <ImagePlus className="size-6" aria-hidden />
      )}
      {pending ? (
        <div className="absolute inset-0 grid place-items-center bg-background/70">
          <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
        </div>
      ) : null}
    </div>
  );

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium" id={`${inputId}-label`}>
        {label}
      </p>
      <div
        className={cn(
          "flex gap-4 rounded-xl border border-dashed p-3 transition-colors",
          shape === "circle" ? "items-center" : "flex-col sm:flex-row sm:items-center",
          dragging ? "border-primary bg-primary/5" : "border-border",
          !enabled && "opacity-70",
        )}
        onDragOver={(e) => {
          if (!enabled) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (enabled) void handle(e.dataTransfer.files[0]);
        }}
      >
        {preview}
        <div className="min-w-0 space-y-2">
          <input
            ref={input}
            id={inputId}
            type="file"
            accept={acceptFor(purpose)}
            className="sr-only"
            aria-labelledby={`${inputId}-label`}
            disabled={!enabled || pending}
            onChange={(e) => void handle(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={value ? "outline" : "default"}
              disabled={!enabled || pending}
              onClick={() => input.current?.click()}
            >
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : value ? <RefreshCw aria-hidden /> : <ImagePlus aria-hidden />}
              {pending ? t("uploading") : value ? t("replace") : t("choose")}
            </Button>
            {value && !pending ? (
              <Button type="button" size="sm" variant="ghost" onClick={() => onChange("")}>
                <Trash2 aria-hidden /> {t("remove")}
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {enabled ? (
              <>
                {t("imageLimits", { size })} <span className="hidden sm:inline">· {t("dropHint")}</span>
              </>
            ) : (
              t("disabled")
            )}
          </p>
          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
