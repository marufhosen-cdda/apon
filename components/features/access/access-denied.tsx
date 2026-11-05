import { getTranslations } from "next-intl/server";
import { ShieldX } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SwitchAccountButton } from "@/components/features/access/switch-account-button";

/** Shared 403 body used by `forbidden.tsx` and the proxy's `/access-denied` rewrite. */
export async function AccessDenied({ section }: { section?: string }) {
  const t = await getTranslations("access");
  const roles =
    section === "admin" ? t("adminOnly") : section === "host" ? t("hostOnly") : t("generic");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-5 grid size-14 place-items-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">
        <ShieldX className="size-7" aria-hidden />
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">403</p>
      <h1 className="mt-1 text-xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{t("text", { roles })}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link href="/dashboard">{t("goHome")}</Link>
        </Button>
        <SwitchAccountButton label={t("signInOther")} />
      </div>
    </div>
  );
}
