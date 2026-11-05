import { getTranslations } from "next-intl/server";

import { Logo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/features/nav/locale-switcher";
import { ThemeToggle } from "@/components/features/nav/theme-toggle";
import { AuthSidePanel } from "@/components/features/auth/auth-side-panel";

/**
 * Two-column auth shell: the form on the left, a photo with page-specific
 * context on the right (large screens). On phones only the form shows.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [t, tn] = await Promise.all([getTranslations("common"), getTranslations("nav")]);

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex min-h-dvh flex-col">
        <header className="flex h-16 items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2" aria-label={t("appName")}>
            <Logo />
          </Link>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <LocaleSwitcher />
          </div>
        </header>

        <main id="main" className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 px-5 pb-6 text-xs text-muted-foreground sm:px-8">
          <p>
            © {new Date().getFullYear()} APON · {t("tagline")}
          </p>
          <nav className="flex gap-4">
            <Link href="/guidelines" className="hover:text-foreground">
              {tn("guidelines")}
            </Link>
            <Link href="/credits" className="hover:text-foreground">
              {tn("credits")}
            </Link>
          </nav>
        </footer>
      </div>

      <AuthSidePanel />
    </div>
  );
}
