"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, Menu, X } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/** Phone-sized menu for the landing page header (section links + auth). */
export function MarketingMobileNav({ links }: { links: { href: string; label: string }[] }) {
  const t = useTranslations("nav");
  const tl = useTranslations("landing.cta");
  const [open, setOpen] = useState(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
        aria-label={t("openMenu")}
      >
        <Menu className="size-5" aria-hidden />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 md:hidden" />
        <DialogPrimitive.Content className="fixed inset-x-0 top-0 z-50 rounded-b-2xl border-b border-border bg-background p-4 shadow-xl data-[state=open]:animate-in data-[state=open]:slide-in-from-top md:hidden">
          <DialogPrimitive.Title className="sr-only">{t("menu")}</DialogPrimitive.Title>
          <div className="flex items-center justify-between">
            <Logo />
            <DialogPrimitive.Close
              className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
              aria-label={t("closeMenu")}
            >
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          <nav aria-label={t("menu")} className="mt-4 grid">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-[15px] font-medium hover:bg-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
            <Button asChild variant="outline">
              <Link href="/sign-in" onClick={() => setOpen(false)}>
                {t("signIn")}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up" onClick={() => setOpen(false)}>
                {tl("button")} <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
