"use client";

import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";
import { deleteVenue, saveVenue } from "@/lib/actions/admin";
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
import { Switch } from "@/components/ui/switch";
import { LocationPicker } from "@/components/features/locations/location-picker";
import { ImageUpload } from "@/components/features/uploads/image-upload";
import type { LocationCrumb } from "@/lib/geo/levels";

export interface VenueFormValues {
  id?: number;
  name: string;
  areaId: string;
  address: string;
  mapUrl: string;
  imageUrl: string;
  type: string;
  isPublic: boolean;
  approved: boolean;
}


const TYPES = ["cafe", "park", "sports", "coworking", "other"] as const;

/** Venues power the host flow: only approved public venues are bookable. */
export function VenueForm({
  areaTrail = [],
  initial,
  mode = "create",
  label,
}: {
  areaTrail?: LocationCrumb[];
  initial?: VenueFormValues;
  mode?: "create" | "edit";
  label?: string;
}) {
  const t = useTranslations("admin.venues");
  const errorMessage = useErrorMessage();
  const tc = useTranslations("common");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<VenueFormValues>(
    initial ?? {
      name: "",
      areaId: "",
      address: "",
      mapUrl: "",
      imageUrl: "",
      type: "cafe",
      isPublic: true,
      approved: false,
    },
  );

  function set<K extends keyof VenueFormValues>(key: K, value: VenueFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      const result = await saveVenue(undefined, {
        ...(values.id ? { id: values.id } : {}),
        name: values.name,
        areaId: values.areaId,
        address: values.address,
        mapUrl: values.mapUrl,
        imageUrl: values.imageUrl,
        type: values.type,
        isPublic: values.isPublic ? "true" : "",
        approved: values.approved ? "true" : "",
      });

      if (!result.ok) {
        toast.error(errorMessage(result.error, "errors.validation"));
        return;
      }
      toast.success(t("saved"));
      setOpen(false);
      router.refresh();
    });
  }

  function remove() {
    if (!values.id) return;
    startTransition(async () => {
      const result = await deleteVenue(undefined, { id: values.id });
      if (!result.ok) {
        toast.error(errorMessage(result.error));
        return;
      }
      toast.success(t("deleted"));
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === "create" ? "default" : "ghost"} size={mode === "create" ? "default" : "sm"}>
          {mode === "create" ? <Plus aria-hidden /> : <Pencil aria-hidden />}
          {label ?? (mode === "create" ? t("create") : t("edit"))}
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle>{mode === "create" ? t("create") : t("edit")}</DialogTitle>
          <DialogDescription>{t("formHint")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="venue-name">{t("name")}</Label>
            <Input
              id="venue-name"
              value={values.name}
              maxLength={120}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("area")}</Label>
            <LocationPicker
              initialTrail={areaTrail}
              layout="grid"
              onChange={(id) => set("areaId", id ? String(id) : "")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="venue-type">{t("type")}</Label>
              <NativeSelect
                id="venue-type"
                value={values.type}
                onChange={(e) => set("type", e.target.value)}
              >
                {TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`types.${type}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue-map">{t("mapUrl")}</Label>
              <Input
                id="venue-map"
                type="url"
                value={values.mapUrl}
                placeholder="https://maps.google.com/…"
                onChange={(e) => set("mapUrl", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue-address">{t("address")}</Label>
            <Input
              id="venue-address"
              value={values.address}
              maxLength={300}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>

          <ImageUpload
            purpose="venue_photo"
            label={t("photo")}
            value={values.imageUrl}
            onChange={(url) => set("imageUrl", url)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <Label htmlFor="venue-public">{t("isPublic")}</Label>
              <Switch
                id="venue-public"
                checked={values.isPublic}
                onCheckedChange={(checked) => set("isPublic", Boolean(checked))}
              />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <Label htmlFor="venue-approved">{t("approve")}</Label>
              <Switch
                id="venue-approved"
                checked={values.approved}
                onCheckedChange={(checked) => set("approved", Boolean(checked))}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 border-t border-border bg-card px-5 py-3 sm:justify-between">
          {values.id ? (
            <Button type="button" variant="destructive" onClick={remove} disabled={pending}>
              <Trash2 aria-hidden />
              {tc("delete")}
            </Button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {tc("cancel")}
            </Button>
            <Button type="button" onClick={save} disabled={pending || !values.name.trim()}>
              {pending ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
              {tc("save")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
