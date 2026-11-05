import { getTranslations } from "next-intl/server";
import { Heart } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { MarketingMobileNav } from "@/components/features/nav/marketing-mobile-nav";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/features/nav/locale-switcher";
import { ThemeToggle } from "@/components/features/nav/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [t, tn, tc] = await Promise.all([
    getTranslations("landing"),
    getTranslations("nav"),
    getTranslations("common"),
  ]);

  const sectionLinks = [
    { href: "/#how", label: t("how.title") },
    { href: "/#categories", label: t("activities.title") },
    { href: "/#safety", label: t("safety.title") },
    { href: "/#faq", label: t("faq.title") },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="APON home">
            <Logo />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {sectionLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <LocaleSwitcher />
            <Button asChild size="sm" variant="ghost" className="ml-1 hidden sm:inline-flex">
              <Link href="/sign-in">{tn("signIn")}</Link>
            </Button>
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/sign-up">{t("cta.button")}</Link>
            </Button>
            <MarketingMobileNav links={sectionLinks} />
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <Logo tagline={tc("tagline")} markClassName="size-8" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footer.note")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer.product")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/sign-up" className="hover:text-foreground">
                  {t("cta.button")}
                </Link>
              </li>
              <li>
                <Link href="/#how" className="hover:text-foreground">
                  {t("how.title")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer.community")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/guidelines" className="hover:text-foreground">
                  {tn("guidelines")}
                </Link>
              </li>
              <li>
                <Link href="/credits" className="hover:text-foreground">
                  {t("footer.credits")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer.about")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/credits" className="hover:text-foreground">
                  {t("footer.credits")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator />
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} APON · {tc("tagline")}</p>
          <p className="inline-flex items-center gap-1">
            {t("footer.rights")} <Heart className="size-3 text-primary" aria-hidden />
          </p>
        </div>
      </footer>
    </div>
  );
}
