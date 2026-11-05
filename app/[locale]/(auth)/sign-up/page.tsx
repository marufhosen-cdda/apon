import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/components/features/auth/auth-fields";
import { SignUpForm } from "./sign-up-form";

export async function generateMetadata() {
  const t = await getTranslations("auth");
  return { title: t("createAccount") };
}

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [t, tn, params] = await Promise.all([getTranslations("auth"), getTranslations("nav"), searchParams]);

  return (
    <AuthCard
      title={t("signUpTitle")}
      subtitle={t("signUpSubtitle")}
      footer={
        <div className="space-y-2">
          <p>
            {t("haveAccount")}{" "}
            <Link href="/sign-in" className="font-medium text-primary hover:underline">
              {t("signInLink")}
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
      <SignUpForm next={params.next} />
    </AuthCard>
  );
}
