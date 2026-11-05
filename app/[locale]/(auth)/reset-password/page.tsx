import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/components/features/auth/auth-fields";
import { ResetPasswordForm } from "./reset-password-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("resetTitle") };
}

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const [t, params] = await Promise.all([getTranslations("auth"), searchParams]);
  const email = params.email?.trim().toLowerCase() ?? "";
  return (
    <AuthCard
      title={t("resetTitle")}
      subtitle={email ? t("resetSubtitle", { email }) : t("resetSubtitleNoEmail")}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p>
            {t("noResetCode")}{" "}
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              {t("requestNewCode")}
            </Link>
          </p>
          <Link href="/sign-in" className="hover:text-foreground">
            {t("backToSignIn")}
          </Link>
        </div>
      }
    >
      <ResetPasswordForm email={email} />
    </AuthCard>
  );
}
