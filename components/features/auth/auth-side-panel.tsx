"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { CheckCircle2, KeyRound, LogIn, MailCheck, ShieldCheck, UserPlus, type LucideIcon } from "lucide-react";

import { usePathname } from "@/i18n/navigation";
import { images } from "@/lib/images";
import { LogoMark } from "@/components/brand/logo";

type Variant = "signIn" | "signUp" | "verify" | "recovery";

const VARIANTS: Record<Variant, { photo: { src: string; alt: string; photographer: string }; icon: LucideIcon }> = {
  signIn: { photo: images.hero, icon: LogIn },
  signUp: { photo: images.howItWorks.meet, icon: UserPlus },
  verify: { photo: images.howItWorks.share, icon: MailCheck },
  recovery: { photo: images.safety, icon: KeyRound },
};

function variantFor(pathname: string): Variant {
  if (pathname.startsWith("/sign-up")) return "signUp";
  if (pathname.startsWith("/verify")) return "verify";
  if (pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password")) return "recovery";
  return "signIn";
}

/**
 * Right-hand column of the auth layout (lg+): a photo with page-specific
 * context — why to join, what verification protects, how recovery works.
 */
export function AuthSidePanel() {
  const t = useTranslations("authPanel");
  const variant = variantFor(usePathname());
  const { photo, icon: Icon } = VARIANTS[variant];
  const points = t.raw(`${variant}.points`) as string[];
  // If the photo can't load, the brand gradient alone still looks finished.
  const [failed, setFailed] = useState<string | null>(null);

  return (
    <aside className="relative hidden overflow-hidden bg-[#0b3a35] lg:block" aria-label={t(`${variant}.eyebrow`)}>
      {failed !== photo.src ? (
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          priority
          sizes="50vw"
          className="object-cover"
          onError={() => setFailed(photo.src)}
        />
      ) : null}
      {/* Brand-tinted scrim keeps the copy readable over any photo. */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#06201d] via-[#0b3a35]/80 to-[#0f766e]/35" aria-hidden />

      <div className="relative flex h-full flex-col justify-between p-10 text-white xl:p-14">
        <div className="flex items-center gap-2.5">
          <LogoMark className="size-9" />
          <span className="text-sm font-extrabold tracking-[0.16em]">APON</span>
        </div>

        <div className="max-w-lg space-y-6">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">
            <Icon className="size-3.5" aria-hidden />
            {t(`${variant}.eyebrow`)}
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight xl:text-4xl">{t(`${variant}.title`)}</h2>
          <ul className="space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-[15px] text-white/90">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[#fbbf24]" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
          {variant === "recovery" ? (
            <p className="flex items-start gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm backdrop-blur">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#fbbf24]" aria-hidden />
              {t("recovery.note")}
            </p>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-4 text-xs text-white/70">
          <p className="max-w-xs">{t("trust")}</p>
          <p>{t("photoBy", { name: photo.photographer.trim() })}</p>
        </div>
      </div>
    </aside>
  );
}
