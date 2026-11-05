"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorKey } from "@/lib/auth-errors";
import { emailSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/features/auth/auth-fields";

/** Requests a reset code. Same response whether or not the email exists. */
export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const te = useTranslations("auth.errors");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return setError(te("emailInvalid"));
    setError(null);
    startTransition(async () => {
      const result = await authClient.emailOtp.requestPasswordReset({ email: parsed.data });
      if (result.error) {
        setError(te(authErrorKey(result.error)));
        return;
      }
      toast.success(t("resetSentIfExists", { email: parsed.data }));
      router.push(`/reset-password?email=${encodeURIComponent(parsed.data)}`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "forgot-error" : undefined}
        />
      </div>
      <FieldError id="forgot-error" message={error} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Send aria-hidden />}
        {pending ? t("sendingResetCode") : t("sendResetCode")}
      </Button>
    </form>
  );
}
