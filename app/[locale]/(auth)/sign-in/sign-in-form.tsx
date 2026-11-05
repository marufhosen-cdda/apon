"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";

import { Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorKey } from "@/lib/auth-errors";
import { isEmailIdentifier, signInSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, PasswordInput } from "@/components/features/auth/auth-fields";

/** Email-or-username + password sign-in. */
export function SignInForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const te = useTranslations("auth.errors");
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = signInSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      setError(te(parsed.error.issues[0].message.replace("auth.errors.", "")));
      return;
    }
    setError(null);

    startTransition(async () => {
      const id = parsed.data.identifier;
      const result = isEmailIdentifier(id)
        ? await authClient.signIn.email({ email: id.toLowerCase(), password: parsed.data.password })
        : await authClient.signIn.username({ username: id, password: parsed.data.password });

      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED") {
          // Better Auth has just emailed a fresh code (sendOnSignIn).
          toast.info(t("emailNotVerified"));
          const query = new URLSearchParams();
          if (isEmailIdentifier(id)) query.set("email", id.toLowerCase());
          if (next) query.set("next", next);
          router.push(`/verify?${query.toString()}`);
          return;
        }
        setPassword("");
        setError(te(authErrorKey(result.error)));
        return;
      }

      const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
      // Full navigation so the proxy sees the new session cookie.
      window.location.href = target;
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="identifier">{t("identifierLabel")}</Label>
        <Input
          id="identifier"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={t("identifierPlaceholder")}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "signin-error" : undefined}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("passwordLabel")}</Label>
          <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            {t("forgotPassword")}
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder={t("passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "signin-error" : undefined}
        />
      </div>

      <FieldError id="signin-error" message={error} />

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="animate-spin" aria-hidden /> : <LogIn aria-hidden />}
        {pending ? t("signingIn") : t("signInButton")}
      </Button>
    </form>
  );
}
