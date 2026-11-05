import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/components/features/auth/auth-fields";
import { SignInForm } from "./sign-in-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("signInButton") };
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; reset?: string }>;
}) {
  const [t, tn, params] = await Promise.all([getTranslations("auth"), getTranslations("nav"), searchParams]);

  return (
    <AuthCard
      title={t("signInTitle")}
      subtitle={t("signInSubtitle")}
      footer={
        <div className="space-y-2">
          <p>
            {t("noAccount")}{" "}
            <Link href={params.next ? `/sign-up?next=${encodeURIComponent(params.next)}` : "/sign-up"} className="font-medium text-primary hover:underline">
              {t("createAccount")}
            </Link>
          </p>
          <p className="text-xs">
            {t("terms")}{" "}
            <Link href="/guidelines" className="underline underline-offset-2 hover:text-foreground">
              {tn("guidelines")}
            </Link>
          </p>
        </div>
      }
    >
      {params.error === "suspended" ? (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t("errorSuspended")}
        </p>
      ) : null}
      {params.reset === "1" ? (
        <p className="mb-4 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
          {t("resetDone")}
        </p>
      ) : null}
      <SignInForm next={params.next} />
    </AuthCard>
  );
}
