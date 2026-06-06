"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMasters, useWardsForMunicipality } from "@/hooks/masters/useMasters";
import { useSaveDraft } from "@/hooks/surveys/useSurveys";
import { applyServerFieldErrors } from "@/lib/errors";
import { formatPropertyId } from "@/lib/survey/area";
import type { SurveyListItem } from "@/schema/surveys/index";
import { surveyDraftSchema, type SurveyDraftValues } from "@/schema/surveys/surveySchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Droplets, MapPinHouse, Receipt, Users } from "lucide-react";
import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

/* ─── Section card colours ─────────────────────────────────────────── */
const SECTION_STYLES = {
  blue: {
    border: "border-l-[3px] border-l-blue-500 dark:border-l-blue-400",
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    title: "text-blue-800 dark:text-blue-300",
    icon: "text-blue-500 dark:text-blue-400",
  },
  violet: {
    border: "border-l-[3px] border-l-violet-500 dark:border-l-violet-400",
    bg: "bg-violet-50/50 dark:bg-violet-950/20",
    title: "text-violet-800 dark:text-violet-300",
    icon: "text-violet-500 dark:text-violet-400",
  },
  emerald: {
    border: "border-l-[3px] border-l-emerald-500 dark:border-l-emerald-400",
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    title: "text-emerald-800 dark:text-emerald-300",
    icon: "text-emerald-500 dark:text-emerald-400",
  },
  amber: {
    border: "border-l-[3px] border-l-amber-500 dark:border-l-amber-400",
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
    title: "text-amber-800 dark:text-amber-300",
    icon: "text-amber-500 dark:text-amber-400",
  },
  cyan: {
    border: "border-l-[3px] border-l-cyan-500 dark:border-l-cyan-400",
    bg: "bg-cyan-50/50 dark:bg-cyan-950/20",
    title: "text-cyan-800 dark:text-cyan-300",
    icon: "text-cyan-500 dark:text-cyan-400",
  },
} as const;

function Section({
  title,
  children,
  color,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  color: keyof typeof SECTION_STYLES;
  icon: React.ReactNode;
}) {
  const s = SECTION_STYLES[color];
  return (
    <Card className={`${s.border} ${s.bg} shadow-sm`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-base font-semibold ${s.title}`}>
          <span className={s.icon}>{icon}</span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</CardContent>
    </Card>
  );
}

function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-destructive">{msg}</p> : null;
}

export function SurveyForm({
  localId,
  municipalityId,
  existing,
  onSaved,
  onRegisterSave,
}: {
  localId: string;
  municipalityId?: string;
  existing?: SurveyListItem | null;
  onSaved?: (surveyId: string) => void;
  onRegisterSave?: (fn: () => Promise<boolean>) => void;
}) {
  const { masters } = useMasters();
  const saveDraft = useSaveDraft();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<SurveyDraftValues>({
    resolver: zodResolver(surveyDraftSchema),
    defaultValues: {
      localId,
      municipalityId: existing?.municipalityId ?? municipalityId ?? "",
      clientUpdatedAt: Date.now(),
      wardNo: existing?.wardNo ?? "",
      parcelNo: existing?.parcelNo ?? "",
      unitNo: existing?.unitNo ?? "",
      sectorNo: existing?.sectorNo ?? "",
      oldPropertyNo: existing?.oldPropertyNo ?? "",
      propertyId: existing?.propertyId ?? "",
      constructedYear: existing?.constructedYear,
      isSlum: existing?.isSlum ?? false,
      respondentName: existing?.respondentName ?? "",
      relationship: existing?.relationship as any,
      familySize: existing?.familySize,
      mobileNo: existing?.mobileNo ?? "",
      altMobileNo: existing?.altMobileNo ?? "",
      houseNo: existing?.houseNo ?? "",
      locality: existing?.locality ?? "",
      colonyName: existing?.colonyName ?? "",
      pinCode: existing?.pinCode ?? "",
      assessmentYear: existing?.assessmentYear ?? "",
      ownershipType: existing?.ownershipType ?? "",
      propertyUse: existing?.propertyUse ?? "",
      propertyType: existing?.propertyType ?? "",
      situation: existing?.situation ?? "",
      roadType: existing?.roadType ?? "",
      taxRateZone: existing?.taxRateZone ?? "",
      plotSqft: existing?.plotSqft ?? 0,
      plinthSqft: existing?.plinthSqft ?? 0,
      municipalWaterConnection: existing?.municipalWaterConnection ?? false,
      waterSource: (existing?.waterSource as any) ?? undefined,
      sanitationType: (existing?.sanitationType as any) ?? undefined,
      municipalWasteCollection: existing?.municipalWasteCollection ?? false,
    } as Partial<SurveyDraftValues> as SurveyDraftValues,
  });

  /* Keep refs fresh so the registered save fn never has a stale closure */
  const saveDraftRef = useRef(saveDraft);
  saveDraftRef.current = saveDraft;
  const setErrorRef = useRef(setError);
  setErrorRef.current = setError;
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  /* Expose an imperative save() to the parent editor */
  useEffect(() => {
    if (!onRegisterSave) return;
    // react-doctor-disable-next-line react-doctor/no-pass-data-to-parent, react-doctor/no-prop-callback-in-effect -- parent registers save handler once on mount
    onRegisterSave(
      () =>
        new Promise<boolean>((resolve) => {
          handleSubmit(
            async (values) => {
              try {
                const id = await saveDraftRef.current({ ...values, clientUpdatedAt: Date.now() } as any);
                toast.success("Details saved");
                onSavedRef.current?.(id as unknown as string);
                resolve(true);
              } catch (e) {
                const parsed = applyServerFieldErrors(e, setErrorRef.current as any);
                toast.error(parsed.message);
                resolve(false);
              }
            },
            () => resolve(false),
          )();
        }),
    );
  }, [onRegisterSave, handleSubmit]);

  /* Called when the user presses Enter inside a field (form's own submit) */
  async function onSubmit(values: SurveyDraftValues) {
    try {
      const id = await saveDraftRef.current({ ...values, clientUpdatedAt: Date.now() } as any);
      toast.success("Details saved");
      onSavedRef.current?.(id as unknown as string);
    } catch (e) {
      const parsed = applyServerFieldErrors(e, setErrorRef.current as any);
      toast.error(parsed.message);
    }
  }

  const muniId = watch("municipalityId");
  const wards = useWardsForMunicipality(muniId);
  const propertyUse = watch("propertyUse");
  const wardNo = watch("wardNo");
  const parcelNo = watch("parcelNo");
  const subcats = propertyUse ? (masters?.propertyUseSubcategories?.[propertyUse] ?? []) : [];
  const selectedUlb = (masters?.ulbs ?? []).find((m: { _id: string }) => m._id === muniId);
  const previewPropertyId =
    formatPropertyId({
      ulbCode: selectedUlb?.code ?? "",
      wardNo: wardNo ?? "",
      parcelNo: parcelNo ?? "",
      propertyUse: propertyUse ?? "",
    }) ?? existing?.propertyId;

  const sel = (name: keyof SurveyDraftValues, options: { value: string; label: string }[], placeholder: string) => (
    <Controller
      control={control}
      name={name as any}
      render={({ field }) => (
        <Select value={(field.value as string) ?? ""} onValueChange={field.onChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Section title="Tenant & Property" color="blue" icon={<Building2 className="h-4 w-4" />}>
        <div className="space-y-1.5">
          <Label>Municipality (ULB)</Label>
          {sel(
            "municipalityId",
            (masters?.ulbs ?? []).map((m: any) => ({ value: m._id, label: m.name })),
            "Select ULB",
          )}
          <FieldErr msg={errors.municipalityId?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Ward</Label>
          {sel(
            "wardNo",
            (wards ?? []).map((w: any) => ({ value: w.wardNo, label: `Ward ${w.wardNo}` })),
            "Select ward",
          )}
          <FieldErr msg={errors.wardNo?.message} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Property ID</Label>
          <Input
            readOnly
            value={previewPropertyId ?? ""}
            placeholder="Auto-generated after ward, parcel & property use"
            className="bg-muted/50 font-mono"
          />
          <p className="text-xs text-muted-foreground">
            Format: ULB (6 digits) – Ward (3 digits) – Parcel (5 digits) – Use code, e.g. 800828-001-00001-P
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Parcel No</Label>
          <Input {...register("parcelNo")} />
          <FieldErr msg={errors.parcelNo?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Unit No</Label>
          <Input {...register("unitNo")} />
          <FieldErr msg={errors.unitNo?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Sector No</Label>
          <Input {...register("sectorNo")} />
        </div>
        <div className="space-y-1.5">
          <Label>Old Property No</Label>
          <Input {...register("oldPropertyNo")} />
        </div>
        <div className="space-y-1.5">
          <Label>Constructed Year</Label>
          <Input type="number" {...register("constructedYear", { valueAsNumber: true })} />
          <FieldErr msg={errors.constructedYear?.message} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Controller
            control={control}
            name="isSlum"
            render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />}
          />
          <Label>Slum property</Label>
        </div>
      </Section>

      <Section title="Owner" color="violet" icon={<Users className="h-4 w-4" />}>
        <div className="space-y-1.5">
          <Label>Respondent name</Label>
          <Input {...register("respondentName")} />
        </div>
        <div className="space-y-1.5">
          <Label>Relationship</Label>
          {sel("relationship", masters?.relationships ?? [], "Select")}
        </div>
        <div className="space-y-1.5">
          <Label>Family size</Label>
          <Input type="number" {...register("familySize", { valueAsNumber: true })} />
          <FieldErr msg={errors.familySize?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Primary mobile</Label>
          <Input {...register("mobileNo")} />
          <FieldErr msg={errors.mobileNo?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Alt mobile</Label>
          <Input {...register("altMobileNo")} />
        </div>
      </Section>

      <Section title="Address" color="emerald" icon={<MapPinHouse className="h-4 w-4" />}>
        <div className="space-y-1.5">
          <Label>House No</Label>
          <Input {...register("houseNo")} />
        </div>
        <div className="space-y-1.5">
          <Label>Locality</Label>
          <Input {...register("locality")} />
          <FieldErr msg={errors.locality?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Colony name</Label>
          <Input {...register("colonyName")} />
        </div>
        <div className="space-y-1.5">
          <Label>PIN code</Label>
          <Input {...register("pinCode")} />
        </div>
      </Section>

      <Section title="Taxation" color="amber" icon={<Receipt className="h-4 w-4" />}>
        <div className="space-y-1.5">
          <Label>Assessment year</Label>
          {sel("assessmentYear", masters?.assessmentYears ?? [], "Select")}
          <FieldErr msg={errors.assessmentYear?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Ownership type</Label>
          {sel("ownershipType", masters?.ownershipTypes ?? [], "Select")}
        </div>
        <div className="space-y-1.5">
          <Label>Property use</Label>
          {sel("propertyUse", masters?.propertyUses ?? [], "Select")}
        </div>
        <div className="space-y-1.5">
          <Label>Property type / subcategory</Label>
          {sel("propertyType", subcats, subcats.length ? "Select" : "Pick a property use first")}
        </div>
        <div className="space-y-1.5">
          <Label>Situation</Label>
          {sel("situation", masters?.situations ?? [], "Select")}
        </div>
        <div className="space-y-1.5">
          <Label>Road type</Label>
          {sel("roadType", masters?.roadTypes ?? [], "Select")}
        </div>
        <div className="space-y-1.5">
          <Label>Tax rate zone</Label>
          {sel("taxRateZone", masters?.taxRateZones ?? [], "Select")}
        </div>
      </Section>

      <Section title="Services" color="cyan" icon={<Droplets className="h-4 w-4" />}>
        <div className="flex items-center gap-2 pt-6">
          <Controller
            control={control}
            name="municipalWaterConnection"
            render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />}
          />
          <Label>Municipal water connection</Label>
        </div>
        <div className="space-y-1.5">
          <Label>Water source</Label>
          {sel("waterSource", masters?.waterSources ?? [], "Select")}
          <FieldErr msg={errors.waterSource?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Sanitation type</Label>
          {sel("sanitationType", masters?.sanitationTypes ?? [], "Select")}
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Controller
            control={control}
            name="municipalWasteCollection"
            render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />}
          />
          <Label>Door-to-door waste collection</Label>
        </div>
      </Section>

      {/* No visible save button — parent editor triggers save via onRegisterSave */}
    </form>
  );
}
