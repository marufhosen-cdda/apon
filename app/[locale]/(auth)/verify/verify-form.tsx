"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, MailCheck, RotateCw } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { authErrorKey } from "@/lib/auth-errors";
import { emailSchema, otpCodeSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/features/auth/auth-fields";
import { CodeInput } from "@/components/features/auth/code-input";

const RESEND_SECONDS = 60;

/** Enter the emailed code to verify the account; signs the user in on success. */
export function VerifyForm({ email: initialEmail, next }: { email?: string; next?: string }) {
  const t = useTranslations("auth");
  const te = useTranslations("auth.errors");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(initialEmail ? RESEND_SECONDS : 0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  function verify(event: React.FormEvent) {
    event.preventDefault();
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) return setError(te("emailInvalid"));
    if (!otpCodeSchema.safeParse(code).success) return setError(te("codeInvalid"));
    setError(null);

    startTransition(async () => {
      const result = await authClient.emailOtp.verifyEmail({ email: parsedEmail.data, otp: code });
      if (result.error) {
        setCode("");
        setError(te(authErrorKey(result.error)));
        return;
      }
      toast.success(t("verified"));
      const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      window.location.href = target;
    });
  }

  function resend() {
    const parsedEmail = emailSchema.safeParse(email);
    if (!parsedEmail.success) return setError(te("emailInvalid"));
    if (cooldown > 0) return;
    startTransition(async () => {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: parsedEmail.data,
        type: "email-verification",
      });
      if (result.error) {
        setError(te(authErrorKey(result.error)));
        return;
      }
      setError(null);
      setCooldown(RESEND_SECONDS);
      toast.success(t("codeSent"));
    });
  }

  return (
    <form onSubmit={verify} className="space-y-4" noValidate>
      {!initialEmail ? (
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="code">{t("codeLabel")}</Label>
        <CodeInput
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "verify-error" : undefined}
          autoFocus={Boolean(initialEmail)}
        />
      </div>

      <FieldError id="verify-error" message={error} />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <MailCheck aria-hidden />}
        {t("verifyButton")}
      </Button>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("checkSpam")}</span>
        <button
          type="button"
          onClick={resend}
          disabled={pending || cooldown > 0}
          className="inline-flex items-center gap-1 font-medium text-primary disabled:text-muted-foreground"
        >
          <RotateCw className="size-3" aria-hidden />
          {cooldown > 0 ? t("resendIn", { seconds: cooldown }) : t("resend")}
        </button>
      </div>
    </form>
  );
}
