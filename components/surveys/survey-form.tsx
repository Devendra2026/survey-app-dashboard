"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMasters, useWardsForMunicipality } from "@/hooks/masters/useMasters";
import { useSaveDraft } from "@/hooks/surveys/useSurveys";
import { applyServerFieldErrors } from "@/lib/errors";
import type { SurveyDetail } from "@/schema/surveys/index";
import { surveyDraftSchema, type SurveyDraftValues } from "@/schema/surveys/surveySchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
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
}: {
  localId: string;
  municipalityId?: string;
  existing?: SurveyDetail | null;
  onSaved?: (surveyId: string) => void;
}) {
  const { masters } = useMasters();
  const saveDraft = useSaveDraft();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors, isSubmitting },
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
      electricityNo: existing?.electricityNo ?? "",
    } as Partial<SurveyDraftValues> as SurveyDraftValues,
  });

  const muniId = watch("municipalityId");
  const wards = useWardsForMunicipality(muniId);
  const propertyUse = watch("propertyUse");
  const subcats = propertyUse ? (masters?.propertyUseSubcategories?.[propertyUse] ?? []) : [];

  async function onSubmit(values: SurveyDraftValues) {
    try {
      const id = await saveDraft({ ...values, clientUpdatedAt: Date.now() } as any);
      toast.success("Draft saved");
      onSaved?.(id as unknown as string);
    } catch (e) {
      const parsed = applyServerFieldErrors(e, setError as any);
      toast.error(parsed.message);
    }
  }

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
      <Section title="Tenant & Property">
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
        <div className="space-y-1.5">
          <Label>Property ID</Label>
          <Input {...register("propertyId")} />
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

      <Section title="Owner">
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
          <FieldErr msg={errors.altMobileNo?.message} />
        </div>
      </Section>

      <Section title="Address">
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
          <FieldErr msg={errors.colonyName?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>PIN code</Label>
          <Input {...register("pinCode")} />
          <FieldErr msg={errors.pinCode?.message} />
        </div>
      </Section>

      <Section title="Taxation">
        <div className="space-y-1.5">
          <Label>Assessment year</Label>
          {sel("assessmentYear", masters?.assessmentYears ?? [], "Select")}
          <FieldErr msg={errors.assessmentYear?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Ownership type</Label>
          {sel("ownershipType", masters?.ownershipTypes ?? [], "Select")}
          <FieldErr msg={errors.ownershipType?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Property use</Label>
          {sel("propertyUse", masters?.propertyUses ?? [], "Select")}
          <FieldErr msg={errors.propertyUse?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Property type / subcategory</Label>
          {sel("propertyType", subcats, subcats.length ? "Select" : "Pick a property use first")}
          <FieldErr msg={errors.propertyType?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Situation</Label>
          {sel("situation", masters?.situations ?? [], "Select")}
          <FieldErr msg={errors.situation?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Road type</Label>
          {sel("roadType", masters?.roadTypes ?? [], "Select")}
          <FieldErr msg={errors.roadType?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Tax rate zone</Label>
          {sel("taxRateZone", masters?.taxRateZones ?? [], "Select")}
          <FieldErr msg={errors.taxRateZone?.message} />
        </div>
        <div className="space-y-1.5">
          <Label>Plot (sqft)</Label>
          <Input type="number" {...register("plotSqft", { valueAsNumber: true })} />
        </div>
        <div className="space-y-1.5">
          <Label>Plinth (sqft)</Label>
          <Input type="number" {...register("plinthSqft", { valueAsNumber: true })} />
          <FieldErr msg={errors.plinthSqft?.message} />
        </div>
      </Section>

      <Section title="Services">
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
          <FieldErr msg={errors.sanitationType?.message} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Controller
            control={control}
            name="municipalWasteCollection"
            render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />}
          />
          <Label>Door-to-door waste collection</Label>
        </div>
        <div className="space-y-1.5">
          <Label>Electricity No</Label>
          <Input {...register("electricityNo")} />
        </div>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4" /> {isSubmitting ? "Saving…" : "Save draft"}
        </Button>
      </div>
    </form>
  );
}
