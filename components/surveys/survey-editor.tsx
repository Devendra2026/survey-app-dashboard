"use client";

import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { RoleGate } from "@/components/shared/role-gate";
import { FloorsEditor } from "@/components/surveys/floors-editor";
import { GpsCapturePanel } from "@/components/surveys/gps-capture";
import { PhotoUploader } from "@/components/surveys/photo-uploader";
import { SurveyForm } from "@/components/surveys/survey-form";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFloors } from "@/hooks/surveys/useFloors";
import { useSurvey } from "@/hooks/surveys/useSurveys";
import { firstAreaSubmitError, surveyAreaSubmitErrors } from "@/lib/survey/progress";
import { cn } from "@/lib/utils";
import type { SurveyListItem } from "@/schema/surveys/index";
import { Camera, ClipboardList, Layers, MapPin, Save, Send } from "lucide-react";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

const tabTriggerClass =
  "cursor-pointer gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-200 data-[state=active]:bg-brand-navy data-[state=active]:text-white data-[state=active]:shadow-premium-sm dark:data-[state=active]:bg-primary disabled:opacity-40";

function LockedTab({ title, description }: { title: string; description: string }) {
  return (
    <GlassCard padding="md">
      <GlassCardHeader title={title} description={description} />
      <p className="text-sm text-muted-foreground">
        Complete the <strong className="text-foreground">Details</strong> tab first, then return here.
      </p>
    </GlassCard>
  );
}

export function SurveyEditor({
  localId,
  surveyId,
  existing,
  locked = false,
  onSaved,
  showSubmitBar,
  showSaveBar,
  onSubmit,
  submitting,
  submitLabel,
  saveBarLabel,
  saveBarDescription,
  saveBarSecondaryAction,
}: {
  localId: string;
  surveyId?: string;
  existing?: SurveyListItem | null;
  locked?: boolean;
  onSaved?: (surveyId: string) => void;
  showSubmitBar?: boolean;
  /** Save without submitting — used for QC corrections while survey stays in review. */
  showSaveBar?: boolean;
  onSubmit?: () => void;
  submitting?: boolean;
  submitLabel?: string;
  saveBarLabel?: string;
  saveBarDescription?: string;
  saveBarSecondaryAction?: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [saving, setSaving] = useState(false);
  const loaded = useSurvey(surveyId);
  const survey = existing ?? loaded;
  const floors = useFloors(surveyId);
  const canEditSections = !!surveyId && !locked;

  const saveDetailsFn = useRef<(() => Promise<boolean>) | null>(null);
  const saveAreaFn = useRef<(() => Promise<boolean>) | null>(null);
  const plotSqftDraftRef = useRef(0);
  const onPlotSqftChange = useCallback((value: number) => {
    plotSqftDraftRef.current = value;
  }, []);

  async function persistDetailsAndArea(opts?: { validateForSubmit?: boolean }): Promise<boolean> {
    const detailsSaved = await (saveDetailsFn.current?.() ?? Promise.resolve(true));
    if (!detailsSaved) return false;

    const areaSaved = await (saveAreaFn.current?.() ?? Promise.resolve(true));
    if (!areaSaved) {
      setActiveTab("area");
      return false;
    }

    if (opts?.validateForSubmit) {
      const plotSqft = Math.max(plotSqftDraftRef.current, survey?.plotSqft ?? 0);
      const areaErrors = surveyAreaSubmitErrors({
        plotSqft,
        plinthSqft: survey?.plinthSqft,
        floors: (floors ?? []).map((f) => ({ floorName: f.floorName, areaSqft: f.areaSqft })),
      });
      const areaMessage = firstAreaSubmitError(areaErrors);
      if (areaMessage) {
        setActiveTab("area");
        toast.error(areaMessage);
        return false;
      }
    }

    return true;
  }

  async function handleSaveCorrections() {
    setSaving(true);
    try {
      const ok = await persistDetailsAndArea();
      if (ok) toast.success(saveBarLabel ?? "Survey saved");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndSubmit() {
    if (!onSubmit) return;
    setSaving(true);
    try {
      const ok = await persistDetailsAndArea({ validateForSubmit: true });
      if (!ok) return;
      onSubmit();
    } finally {
      setSaving(false);
    }
  }

  const isWorking = submitting || saving;

  const correctionsBar = showSaveBar && canEditSections && (
    <RoleGate capability="surveys.editDraft" fallback={null}>
      <GlassCard variant="accent" padding="md" className="border-amber-500/25 dark:border-amber-400/30">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-900 ring-1 ring-amber-500/25 dark:text-amber-100">
              <Save className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">{saveBarLabel ?? "Save changes"}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {saveBarDescription ??
                  "Saves details and plot area. The survey stays in its current QC status until you approve or return it."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {saveBarSecondaryAction}
            <Button
              disabled={isWorking}
              onClick={handleSaveCorrections}
              className={cn(
                "cursor-pointer rounded-xl bg-amber-600 px-6 text-white shadow-md hover:bg-amber-500 dark:bg-amber-600 dark:hover:bg-amber-500",
                isWorking && "opacity-80",
              )}
            >
              <Save className="h-4 w-4" aria-hidden />
              {isWorking && saving ? "Saving…" : (saveBarLabel ?? "Save changes")}
            </Button>
          </div>
        </div>
      </GlassCard>
    </RoleGate>
  );

  const submitBar = showSubmitBar && onSubmit && canEditSections && (
    <RoleGate capability="surveys.submit" fallback={null}>
      <GlassCard variant="accent" padding="md" className="border-brand-navy/15 dark:border-primary/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy ring-1 ring-brand-navy/15 dark:bg-primary/15 dark:text-primary-foreground dark:ring-primary/25">
              <Send className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-foreground">
                {submitLabel ?? "Submit for QC Review"}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {submitLabel
                  ? "Details will be saved then sent directly to QC."
                  : "Complete all tabs — Details, Area, Photos & GPS — before submitting."}
              </p>
            </div>
          </div>
          <Button
            disabled={isWorking}
            onClick={handleSaveAndSubmit}
            className={cn("btn-brand shrink-0 cursor-pointer rounded-xl px-6 shadow-md", isWorking && "opacity-80")}
          >
            <Send className="h-4 w-4" aria-hidden />
            {isWorking ? (saving ? "Saving…" : "Submitting…") : (submitLabel ?? "Submit for QC")}
          </Button>
        </div>
      </GlassCard>
    </RoleGate>
  );

  return (
    <div className="space-y-5">
      {correctionsBar}
      {submitBar}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="premium-card flex h-auto w-full flex-wrap justify-start gap-1.5 rounded-xl border border-border/60 bg-muted/30 p-1.5 backdrop-blur-sm dark:bg-muted/15">
          <TabsTrigger value="details" className={tabTriggerClass}>
            <ClipboardList className="h-3.5 w-3.5" aria-hidden /> Details
          </TabsTrigger>
          <TabsTrigger value="area" className={tabTriggerClass} disabled={!canEditSections}>
            <Layers className="h-3.5 w-3.5" aria-hidden /> Area
          </TabsTrigger>
          <TabsTrigger value="photos" className={tabTriggerClass} disabled={!canEditSections}>
            <Camera className="h-3.5 w-3.5" aria-hidden /> Photos
          </TabsTrigger>
          <TabsTrigger value="gps" className={tabTriggerClass} disabled={!canEditSections}>
            <MapPin className="h-3.5 w-3.5" aria-hidden /> GPS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-0">
          {locked ? (
            <GlassCard padding="md">
              <p className="text-sm text-muted-foreground">This survey is locked and cannot be edited.</p>
            </GlassCard>
          ) : (
            <SurveyForm
              localId={localId}
              surveyId={surveyId}
              existing={survey as SurveyListItem | null | undefined}
              onSaved={onSaved}
              onRegisterSave={(fn) => {
                saveDetailsFn.current = fn;
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="area" forceMount className={cn("mt-0", activeTab !== "area" && "hidden")}>
          {canEditSections && surveyId ? (
            <FloorsEditor
              surveyId={surveyId}
              plotSqft={survey?.plotSqft}
              plinthSqft={survey?.plinthSqft}
              onRegisterSave={(fn) => {
                saveAreaFn.current = fn;
              }}
              onPlotSqftChange={onPlotSqftChange}
            />
          ) : (
            <LockedTab
              title="Area details"
              description="Plot area, floor rows, plinth, built-up and open land areas."
            />
          )}
        </TabsContent>

        <TabsContent value="photos" className="mt-0">
          {canEditSections && surveyId ? (
            <GlassCard padding="md">
              <GlassCardHeader
                title="Survey Photos"
                description="Front and side photos are required before submitting."
                icon={<Camera className="h-4 w-4" aria-hidden />}
              />
              <PhotoUploader surveyId={surveyId} />
            </GlassCard>
          ) : (
            <LockedTab title="Photos" description="Upload front and side photos of the property." />
          )}
        </TabsContent>

        <TabsContent value="gps" className="mt-0">
          {canEditSections && surveyId ? (
            <GpsCapturePanel surveyId={surveyId} gps={survey?.gps} />
          ) : (
            <LockedTab title="GPS location" description="Capture the property coordinates before submitting." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
