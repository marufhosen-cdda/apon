"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FileText, Loader2, Lock, Paperclip, X } from "lucide-react";

import type { UploadedFile } from "@/lib/actions/uploads";
import { acceptFor, formatBytes, type UploadPurpose } from "@/lib/uploads/policy";
import { Button } from "@/components/ui/button";
import { useUpload } from "./use-upload";
import { useUploadsEnabled } from "./uploads-context";

/**
 * Single private attachment (report evidence, host-application document).
 * Renders a hidden input named `name` holding the upload id, so it works
 * inside plain `<form action>` submissions.
 */
export function FileUpload({
  purpose,
  name,
  label,
}: {
  purpose: Extract<UploadPurpose, "report_evidence" | "host_document">;
  name: string;
  label: string;
}) {
  const t = useTranslations("uploads");
  const enabled = useUploadsEnabled();
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const { upload, pending, error, size } = useUpload(purpose);

  async function handle(picked: File | undefined) {
    if (!picked) return;
    const result = await upload(picked);
    if (result) setFile(result);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium" id={`${inputId}-label`}>
        {label}
      </p>
      <input type="hidden" name={name} value={file?.id ?? ""} />
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
      {file ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
          <FileText className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.bytes)}</span>
          <button
            type="button"
            className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t("remove")}
            onClick={() => setFile(null)}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!enabled || pending}
          onClick={() => input.current?.click()}
        >
          {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Paperclip aria-hidden />}
          {pending ? t("uploading") : t("attach")}
        </Button>
      )}
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {enabled ? (
          <>
            <Lock className="size-3" aria-hidden /> {t("fileLimits", { size })} · {t("privateNote")}
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
  );
}
