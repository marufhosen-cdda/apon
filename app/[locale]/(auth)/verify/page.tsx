import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { emailEnabled, env } from "@/lib/env";
import { AuthCard } from "@/components/features/auth/auth-fields";
import { VerifyForm } from "./verify-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("verifyTitle") };
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; next?: string }>;
}) {
  const [t, params] = await Promise.all([getTranslations("auth"), searchParams]);
  const email = params.email?.trim().toLowerCase() || undefined;
  const devMode = !emailEnabled && env.NODE_ENV !== "production";

  return (
    <AuthCard
      title={t("verifyTitle")}
      subtitle={email ? t("verifySubtitle", { email }) : t("verifySubtitleNoEmail")}
      footer={
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          {t("backToSignIn")}
        </Link>
      }
    >
      {devMode ? (
        <p className="mb-4 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{t("devHint")}</p>
      ) : null}
      <VerifyForm email={email} next={params.next} />
    </AuthCard>
  );
}
