"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { KeyRound, Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { authErrorKey } from "@/lib/auth-errors";
import { changePasswordSchema } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FieldError, PasswordChecklist, PasswordInput } from "@/components/features/auth/auth-fields";

/** Change password (current password required) and revoke other sessions. */
export function SecurityCard({
  hasPassword,
  username,
  email,
}: {
  hasPassword: boolean;
  username: string | null;
  email: string;
}) {
  const t = useTranslations("auth.security");
  const ta = useTranslations("auth");
  const te = useTranslations("auth.errors");
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [revokeOthers, setRevokeOthers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(event: React.FormEvent) {
    event.preventDefault();
    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!parsed.success) return setError(te(parsed.error.issues[0].message.replace("auth.errors.", "")));
    setError(null);
    startTransition(async () => {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: revokeOthers,
      });
      if (result.error) {
        const key = authErrorKey(result.error);
        setError(key === "invalidCredentials" ? t("wrongCurrent") : te(key));
        return;
      }
      setCurrent("");
      setNew("");
      setConfirm("");
      toast.success(t("changed"));
    });
  }

  function signOutOthers() {
    startTransition(async () => {
      const result = await authClient.revokeOtherSessions();
      if (result.error) return void toast.error(te("generic"));
      toast.success(t("signedOutOthers"));
    });
  }

  return (
    <div className="space-y-5">
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-lg bg-muted/60 px-3 py-2">
          <dt className="text-xs text-muted-foreground">{t("username")}</dt>
          <dd className="font-medium">{username ? `@${username}` : "—"}</dd>
        </div>
        <div className="rounded-lg bg-muted/60 px-3 py-2">
          <dt className="text-xs text-muted-foreground">{ta("emailLabel")}</dt>
          <dd className="truncate font-medium">{email}</dd>
        </div>
      </dl>

      {hasPassword ? (
        <form onSubmit={change} className="space-y-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="current-password">{t("currentPassword")}</Label>
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">{t("newPassword")}</Label>
              <PasswordInput id="new-password" autoComplete="new-password" value={newPassword} onChange={(e) => setNew(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
              <PasswordInput
                id="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
          </div>
          <PasswordChecklist password={newPassword} personal={[username ?? "", email]} />
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={revokeOthers}
              onChange={(e) => setRevokeOthers(e.target.checked)}
              className="size-4 rounded border-input accent-[var(--primary)]"
            />
            {t("revokeOthers")}
          </label>
          <FieldError id="security-error" message={error} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <KeyRound aria-hidden />}
              {t("change")}
            </Button>
            <Button type="button" variant="outline" disabled={pending} onClick={signOutOthers}>
              <LogOut aria-hidden /> {t("signOutOthers")}
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2.5">
          <p className="text-sm">{t("noPassword")}</p>
          <Button asChild size="sm">
            <Link href={`/forgot-password`}>{t("setPassword")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
