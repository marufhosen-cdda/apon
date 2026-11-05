"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { KeyRound, Loader2 } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorKey } from "@/lib/auth-errors";
import { resetPasswordSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, PasswordChecklist, PasswordInput } from "@/components/features/auth/auth-fields";
import { CodeInput } from "@/components/features/auth/code-input";

/** Code + new password. Better Auth revokes every session on success. */
export function ResetPasswordForm({ email: initialEmail }: { email: string }) {
  const t = useTranslations("auth");
  const te = useTranslations("auth.errors");
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = resetPasswordSchema.safeParse({ email, otp, password, confirmPassword });
    if (!parsed.success) return setError(te(parsed.error.issues[0].message.replace("auth.errors.", "")));
    setError(null);
    startTransition(async () => {
      const result = await authClient.emailOtp.resetPassword({
        email: parsed.data.email,
        otp: parsed.data.otp,
        password: parsed.data.password,
      });
      if (result.error) {
        setError(te(authErrorKey(result.error)));
        return;
      }
      router.replace("/sign-in?reset=1");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {!initialEmail ? (
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label htmlFor="otp">{t("codeLabel")}</Label>
        <CodeInput id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} autoFocus={Boolean(initialEmail)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("newPasswordLabel")}</Label>
        <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <PasswordChecklist password={password} personal={[email]} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      <FieldError id="reset-error" message={error} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}
        {t("resetButton")}
      </Button>
    </form>
  );
}
