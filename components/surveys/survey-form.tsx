"use client";

import {
  AddressSection,
  OwnerSection,
  ServicesSection,
  TaxationSection,
  TenantPropertySection,
} from "@/components/surveys/survey-form-sections";
import { useMasters, useWardsForMunicipality } from "@/hooks/masters/useMasters";
import { useSaveDraft } from "@/hooks/surveys/useSurveys";
import { applyServerFieldErrors } from "@/lib/errors";
import { formatPropertyId } from "@/lib/survey/area";
import type { SurveyListItem } from "@/schema/surveys/index";
import { surveyDraftSchema, type SurveyDraftValues } from "@/schema/surveys/surveySchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function buildDefaultValues(
  localId: string,
  municipalityId: string | undefined,
  existing?: SurveyListItem | null,
): SurveyDraftValues {
  return {
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
    relationship: existing?.relationship as SurveyDraftValues["relationship"],
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
    waterSource: existing?.waterSource as SurveyDraftValues["waterSource"],
    sanitationType: existing?.sanitationType as SurveyDraftValues["sanitationType"],
    municipalWasteCollection: existing?.municipalWasteCollection ?? false,
  } as SurveyDraftValues;
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
    defaultValues: buildDefaultValues(localId, municipalityId, existing),
  });

  const saveDraftRef = useRef(saveDraft);
  saveDraftRef.current = saveDraft;
  const setErrorRef = useRef(setError);
  setErrorRef.current = setError;
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

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

  const sectionProps = { control, register, errors, masters };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <TenantPropertySection {...sectionProps} wards={wards} previewPropertyId={previewPropertyId} />
      <OwnerSection {...sectionProps} />
      <AddressSection {...sectionProps} />
      <TaxationSection {...sectionProps} subcats={subcats} />
      <ServicesSection {...sectionProps} />
    </form>
  );
}
