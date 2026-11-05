"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, UserPlus, XCircle } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorKey } from "@/lib/auth-errors";
import { isValidUsername, signUpSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, PasswordChecklist, PasswordInput } from "@/components/features/auth/auth-fields";

type Field = "name" | "email" | "username" | "password" | "confirmPassword";

/** Email + username + password registration. Verification happens next, by code. */
export function SignUpForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const te = useTranslations("auth.errors");
  const router = useRouter();
  const [values, setValues] = useState<Record<Field, string>>({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field | "form", string>>>({});
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [pending, startTransition] = useTransition();

  const set = (field: Field, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined, form: undefined }));
    if (field === "username") setUsernameStatus("idle");
  };

  async function checkUsername() {
    const username = values.username.trim();
    if (!isValidUsername(username)) return;
    setUsernameStatus("checking");
    const { data } = await authClient.isUsernameAvailable({ username });
    setUsernameStatus(data?.available === false ? "taken" : data?.available ? "available" : "idle");
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = signUpSchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as Field;
        next[field] ??= te(issue.message.replace("auth.errors.", ""));
      }
      setErrors(next);
      return;
    }

    startTransition(async () => {
      const { email, username, password, name } = parsed.data;
      const result = await authClient.signUp.email({
        email,
        username,
        displayUsername: username,
        password,
        name: name?.trim() || username,
      });
      if (result.error) {
        const key = authErrorKey(result.error);
        if (key === "usernameTaken" || key === "usernameInvalid") {
          setUsernameStatus(key === "usernameTaken" ? "taken" : "idle");
          setErrors({ username: te(key) });
        } else if (key === "passwordWeak") {
          setErrors({ password: te(key) });
        } else {
          setErrors({ form: te(key) });
        }
        return;
      }
      const query = new URLSearchParams({ email });
      if (next) query.set("next", next);
      router.push(`/verify?${query.toString()}`);
    });
  }

  const describe = (field: Field) => (errors[field] ? `${field}-error` : undefined);

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="name">
          {t("nameLabel")} <span className="font-normal text-muted-foreground">({t("optional")})</span>
        </Label>
        <Input
          id="name"
          autoComplete="name"
          maxLength={80}
          placeholder={t("namePlaceholder")}
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t("emailPlaceholder")}
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={describe("email")}
        />
        <FieldError id="email-error" message={errors.email} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="username">{t("usernameLabel")}</Label>
        <Input
          id="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={30}
          placeholder={t("usernamePlaceholder")}
          value={values.username}
          onChange={(e) => set("username", e.target.value)}
          onBlur={checkUsername}
          aria-invalid={Boolean(errors.username) || usernameStatus === "taken"}
          aria-describedby={describe("username") ?? "username-hint"}
        />
        {errors.username ? (
          <FieldError id="username-error" message={errors.username} />
        ) : usernameStatus === "available" ? (
          <p className="flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="size-3.5" aria-hidden /> {t("usernameAvailable")}
          </p>
        ) : usernameStatus === "taken" ? (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <XCircle className="size-3.5" aria-hidden /> {t("usernameTaken")}
          </p>
        ) : (
          <p id="username-hint" className="text-xs text-muted-foreground">
            {t("usernameHint")}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">{t("newPasswordLabel")}</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(e) => set("password", e.target.value)}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={describe("password")}
        />
        <PasswordChecklist password={values.password} personal={[values.username, values.email]} />
        <FieldError id="password-error" message={errors.password} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(e) => set("confirmPassword", e.target.value)}
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={describe("confirmPassword")}
        />
        <FieldError id="confirmPassword-error" message={errors.confirmPassword} />
      </div>

      <FieldError id="form-error" message={errors.form} />

      <Button type="submit" className="w-full" disabled={pending || usernameStatus === "taken"}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <UserPlus aria-hidden />}
        {pending ? t("signingUp") : t("signUpButton")}
      </Button>
    </form>
  );
}
