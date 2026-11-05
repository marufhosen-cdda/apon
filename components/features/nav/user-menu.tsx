"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Mic2,
  Settings,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { can, toRole } from "@/lib/rbac";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
    username?: string | null;
  };
  /** Which panel this menu sits in — controls the "switch panel" entry. */
  panel?: "member" | "admin";
}

/** Avatar menu: identity + role, panel switch (role-gated), profile, settings, sign out. */
export function UserMenu({ user, panel = "member" }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const role = toRole(user.role);

  function signOut() {
    startTransition(async () => {
      await authClient.signOut();
      toast.success(t("common.signOut"));
      router.push("/sign-in");
      router.refresh();
    });
  }

  const initials =
    user.name
      .split(" ")
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "B";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={pending}
          aria-label={t("nav.userMenu")}
          className="flex items-center gap-1 rounded-full outline-none ring-ring transition-shadow focus-visible:ring-2"
        >
          <Avatar className="size-8 border border-border">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex items-center justify-between gap-2 font-normal">
          <span className="min-w-0">
            <span className="block text-[11px] text-muted-foreground">{t("nav.signedInAs")}</span>
            <span className="block truncate text-sm font-semibold">{user.name || "—"}</span>
            {user.username ? (
              <span className="block truncate text-xs text-muted-foreground">@{user.username}</span>
            ) : null}
          </span>
          <Badge variant={role === "admin" ? "info" : role === "host" ? "success" : "secondary"}>
            {t(`roles.${role}`)}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {can(role, "admin.access") ? (
          panel === "admin" ? (
            <DropdownMenuItem onSelect={() => router.push("/home")}>
              <LayoutDashboard className="size-4" aria-hidden /> {t("nav.memberApp")}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => router.push("/admin")}>
              <Shield className="size-4" aria-hidden /> {t("nav.adminPanel")}
            </DropdownMenuItem>
          )
        ) : null}
        {panel === "member" && can(role, "activities.host") ? (
          <DropdownMenuItem onSelect={() => router.push("/host")}>
            <Mic2 className="size-4" aria-hidden /> {t("nav.hostDashboard")}
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuItem onSelect={() => router.push(`/profile/${user.id}`)}>
          <UserIcon className="size-4" aria-hidden /> {t("nav.profile")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          <Settings className="size-4" aria-hidden /> {t("nav.settings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut} disabled={pending}>
          <LogOut className="size-4" aria-hidden /> {t("common.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
