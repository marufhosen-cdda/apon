"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";

import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

/** Signs out, then opens sign-in (signed-in users are redirected away from it otherwise). */
export function SwitchAccountButton({ label }: { label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await authClient.signOut();
          router.push("/sign-in");
          router.refresh();
        })
      }
    >
      <LogOut aria-hidden /> {label}
    </Button>
  );
}
