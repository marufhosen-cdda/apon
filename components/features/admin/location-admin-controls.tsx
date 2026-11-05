"use client";

import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { createLocation, updateLocation } from "@/lib/actions/locations-admin";
import type { LocationLevel } from "@/lib/geo/levels";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

function useErrorToast() {
  const errorMessage = useErrorMessage();
  return (key: string) => {
    toast.error(errorMessage(key));
  };
}

/** "Add location" dialog for the current parent. */
export function AddLocationDialog({
  parentId,
  parentName,
  levels,
}: {
  parentId: number;
  parentName: string;
  levels: LocationLevel[];
}) {
  const t = useTranslations("admin.locations");
  const tl = useTranslations("locations.levels");
  const tc = useTranslations("common");
  const router = useRouter();
  const showError = useErrorToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [level, setLevel] = useState<LocationLevel>(levels.includes("village") ? "village" : levels[0]);
  const [nameEn, setNameEn] = useState("");
  const [nameBn, setNameBn] = useState("");

  function submit() {
    startTransition(async () => {
      const result = await createLocation(undefined, { parentId, level, nameEn, nameBn });
      if (!result.ok) {
        showError(result.error);
        return;
      }
      toast.success(t("saved"));
      setOpen(false);
      setNameEn("");
      setNameBn("");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus aria-hidden /> {t("add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addUnder", { name: parentName })}</DialogTitle>
          <DialogDescription>{t("addHint")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="loc-level">{t("level")}</Label>
            <NativeSelect id="loc-level" value={level} onChange={(e) => setLevel(e.target.value as LocationLevel)}>
              {levels.map((l) => (
                <option key={l} value={l}>
                  {tl(l)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="loc-en">{t("name")}</Label>
              <Input id="loc-en" value={nameEn} maxLength={80} onChange={(e) => setNameEn(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="loc-bn">{t("nameBn")}</Label>
              <Input id="loc-bn" lang="bn" value={nameBn} maxLength={80} onChange={(e) => setNameBn(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {tc("cancel")}
          </Button>
          <Button onClick={submit} disabled={pending || nameEn.trim().length < 2 || !nameBn.trim()}>
            {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Row actions: rename (dialog) and hide/show. */
export function LocationRowActions({
  id,
  nameEn: initialEn,
  nameBn: initialBn,
  isActive,
}: {
  id: number;
  nameEn: string;
  nameBn: string;
  isActive: boolean;
}) {
  const t = useTranslations("admin.locations");
  const tc = useTranslations("common");
  const router = useRouter();
  const showError = useErrorToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [nameEn, setNameEn] = useState(initialEn);
  const [nameBn, setNameBn] = useState(initialBn);

  function run(input: Record<string, unknown>, close = false) {
    startTransition(async () => {
      const result = await updateLocation(undefined, { id, ...input });
      if (!result.ok) {
        showError(result.error);
        return;
      }
      toast.success(t("saved"));
      if (close) setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="flex justify-end gap-1">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="iconSm" aria-label={t("rename")} title={t("rename")}>
            <Pencil aria-hidden />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("rename")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`en-${id}`}>{t("name")}</Label>
              <Input id={`en-${id}`} value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`bn-${id}`}>{t("nameBn")}</Label>
              <Input id={`bn-${id}`} lang="bn" value={nameBn} onChange={(e) => setNameBn(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button disabled={pending} onClick={() => run({ nameEn, nameBn }, true)}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : null}
              {tc("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button
        variant="ghost"
        size="iconSm"
        disabled={pending}
        aria-label={isActive ? t("hide") : t("show")}
        title={isActive ? t("hide") : t("show")}
        onClick={() => run({ isActive: !isActive })}
      >
        {isActive ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
      </Button>
    </div>
  );
}
