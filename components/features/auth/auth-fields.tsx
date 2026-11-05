"use client";

import { forwardRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Eye, EyeOff, X } from "lucide-react";

import { passwordChecks } from "@/lib/validations/auth";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Password input with a show/hide toggle. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, "type">>(
  ({ className, ...props }, ref) => {
    const t = useTranslations("auth");
    const [visible, setVisible] = useState(false);
    return (
      <div className="relative">
        <Input ref={ref} type={visible ? "text" : "password"} className={cn("pr-10", className)} {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

/** Live password requirements (same rules the server enforces). */
export function PasswordChecklist({ password, personal = [] }: { password: string; personal?: string[] }) {
  const t = useTranslations("auth.passwordRules");
  const checks = passwordChecks(password, personal);
  return (
    <ul className="grid gap-1 text-xs sm:grid-cols-2" aria-live="polite">
      {checks.map((check) => (
        <li
          key={check.key}
          className={cn(
            "flex items-center gap-1.5",
            !password ? "text-muted-foreground" : check.ok ? "text-success" : "text-destructive",
          )}
        >
          {check.ok && password ? <Check className="size-3.5 shrink-0" aria-hidden /> : <X className="size-3.5 shrink-0" aria-hidden />}
          {t(check.key)}
        </li>
      ))}
    </ul>
  );
}

/** Small inline error under a field. */
export function FieldError({ id, message }: { id: string; message?: string | null }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  );
}

/** Shell shared by every auth page. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
      {footer ? <div className="mt-6 border-t border-border pt-5 text-sm text-muted-foreground">{footer}</div> : null}
    </div>
  );
}
