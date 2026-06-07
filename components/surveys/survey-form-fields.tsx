"use client";

import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SurveyDraftValues } from "@/schema/surveys/surveySchema";
import { Controller, type Control, type FieldErrors, type Path, type UseFormRegister } from "react-hook-form";

export function SurveyFormSection({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <GlassCard padding="md">
      <GlassCardHeader title={title} icon={icon} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </GlassCard>
  );
}

export function FieldErr({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-destructive">{msg}</p> : null;
}

export function SurveySelect({
  control,
  name,
  options,
  placeholder,
}: {
  control: Control<SurveyDraftValues>;
  name: Path<SurveyDraftValues>;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
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
}

export type SurveyFormSectionProps = {
  control: Control<SurveyDraftValues>;
  register: UseFormRegister<SurveyDraftValues>;
  errors: FieldErrors<SurveyDraftValues>;
  masters:
    | {
        ulbs?: { _id: string; name: string; code?: string }[];
        relationships?: { value: string; label: string }[];
        assessmentYears?: { value: string; label: string }[];
        ownershipTypes?: { value: string; label: string }[];
        propertyUses?: { value: string; label: string }[];
        propertyUseSubcategories?: Record<string, { value: string; label: string }[]>;
        situations?: { value: string; label: string }[];
        roadTypes?: { value: string; label: string }[];
        taxRateZones?: { value: string; label: string }[];
        waterSources?: { value: string; label: string }[];
        sanitationTypes?: { value: string; label: string }[];
      }
    | null
    | undefined;
};
