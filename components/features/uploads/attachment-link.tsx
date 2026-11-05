import { getTranslations } from "next-intl/server";
import { ExternalLink, FileText, Lock } from "lucide-react";

import type { AttachmentLink as Link } from "@/lib/uploads/server";
import { formatBytes } from "@/lib/uploads/policy";

/** Admin-only view of a private attachment through a short-lived signed URL. */
export async function AttachmentLink({ attachment }: { attachment: Link | undefined }) {
  if (!attachment) return null;
  const t = await getTranslations("uploads");
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm">
      <FileText className="size-4 shrink-0 text-primary" aria-hidden />
      <span className="min-w-0 truncate font-medium">{attachment.name}</span>
      <span className="text-xs text-muted-foreground">{formatBytes(attachment.bytes)}</span>
      {attachment.url ? (
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          referrerPolicy="no-referrer"
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          {t("view")} <ExternalLink className="size-3" aria-hidden />
        </a>
      ) : null}
      <span className="flex w-full items-center gap-1 text-[11px] text-muted-foreground">
        <Lock className="size-3" aria-hidden /> {t("linkExpires")}
      </span>
    </div>
  );
}
