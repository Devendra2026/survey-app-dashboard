"use client";

import { RoleGate } from "@/components/shared/role-gate";
import { FloorsEditor } from "@/components/surveys/floors-editor";
import { GpsCapturePanel } from "@/components/surveys/gps-capture";
import { PhotoUploader } from "@/components/surveys/photo-uploader";
import { SurveyForm } from "@/components/surveys/survey-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSurvey } from "@/hooks/surveys/useSurveys";
import type { SurveyListItem } from "@/schema/surveys/index";
import { Camera, Layers, MapPin, Send } from "lucide-react";
import { useRef, useState } from "react";

function LockedTab({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Complete the <strong>Details</strong> tab first, then return here.
        </p>
      </CardContent>
    </Card>
  );
}

export function SurveyEditor({
  localId,
  surveyId,
  existing,
  locked = false,
  onSaved,
  showSubmitBar,
  onSubmit,
  submitting,
  submitLabel,
}: {
  localId: string;
  surveyId?: string;
  existing?: SurveyListItem | null;
  locked?: boolean;
  onSaved?: (surveyId: string) => void;
  showSubmitBar?: boolean;
  onSubmit?: () => void;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [saving, setSaving] = useState(false);
  const loaded = useSurvey(surveyId);
  const survey = existing ?? loaded;
  const canEditSections = !!surveyId && !locked;

  /* Holds the imperative save fn registered by SurveyForm */
  const saveFormFn = useRef<(() => Promise<boolean>) | null>(null);

  async function handleSaveAndSubmit() {
    if (!onSubmit) return;
    setSaving(true);
    try {
      /* Save form fields first (validates + persists Details tab) */
      const saved = await (saveFormFn.current?.() ?? Promise.resolve(true));
      if (!saved) return; // validation or save error — don't submit
    } finally {
      setSaving(false);
    }
    onSubmit();
  }

  const isWorking = submitting || saving;

  /* ── Submit bar (shown above tabs) ──────────────────────────────── */
  const submitBar = showSubmitBar && onSubmit && canEditSections && (
    <RoleGate capability="surveys.submit">
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-indigo-200/70 bg-linear-to-r from-indigo-50 via-blue-50 to-sky-50 px-5 py-4 shadow-sm dark:border-indigo-800/40 dark:from-indigo-950/60 dark:via-blue-950/50 dark:to-sky-950/40">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/60">
            <Send className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
              {submitLabel ?? "Submit for QC Review"}
            </p>
            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/60">
              {submitLabel
                ? "Details will be saved then sent directly to QC."
                : "Complete all tabs — Details, Area, Photos & GPS — before submitting."}
            </p>
          </div>
        </div>
        <Button
          disabled={isWorking}
          onClick={handleSaveAndSubmit}
          className="shrink-0 rounded-full bg-linear-to-r from-indigo-600 to-blue-600 px-6 text-white shadow-sm hover:from-indigo-500 hover:to-blue-500 dark:from-indigo-500 dark:to-blue-600 dark:hover:from-indigo-400 dark:hover:to-blue-500"
        >
          <Send className="h-4 w-4" />
          {isWorking
            ? saving
              ? "Saving…"
              : "Submitting…"
            : (submitLabel ?? "Submit for QC")}
        </Button>
      </div>
    </RoleGate>
  );

  return (
    <div className="space-y-4">
      {/* Submit bar — TOP */}
      {submitBar}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* ── Tab list ────────────────────────────────────────────── */}
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-border/60 bg-muted/40 p-1.5 dark:bg-muted/20">
          <TabsTrigger
            value="details"
            className="gap-1.5 rounded-lg px-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-blue-500"
          >
            <Send className="h-3.5 w-3.5" /> Details
          </TabsTrigger>
          <TabsTrigger
            value="area"
            className="gap-1.5 rounded-lg px-4 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-emerald-500"
            disabled={!canEditSections}
          >
            <Layers className="h-3.5 w-3.5" /> Area
          </TabsTrigger>
          <TabsTrigger
            value="photos"
            className="gap-1.5 rounded-lg px-4 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-violet-500"
            disabled={!canEditSections}
          >
            <Camera className="h-3.5 w-3.5" /> Photos
          </TabsTrigger>
          <TabsTrigger
            value="gps"
            className="gap-1.5 rounded-lg px-4 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-amber-500"
            disabled={!canEditSections}
          >
            <MapPin className="h-3.5 w-3.5" /> GPS
          </TabsTrigger>
        </TabsList>

        {/* ── Details ─────────────────────────────────────────────── */}
        <TabsContent value="details" className="mt-0">
          {locked ? (
            <Card>
              <CardContent className="pt-5 text-sm text-muted-foreground">
                This survey is locked and cannot be edited.
              </CardContent>
            </Card>
          ) : (
            <SurveyForm
              localId={localId}
              existing={survey as SurveyListItem | null | undefined}
              onSaved={onSaved}
              onRegisterSave={(fn) => {
                saveFormFn.current = fn;
              }}
            />
          )}
        </TabsContent>

        {/* ── Area ────────────────────────────────────────────────── */}
        <TabsContent value="area" className="mt-0">
          {canEditSections && surveyId ? (
            <FloorsEditor surveyId={surveyId} plotSqft={survey?.plotSqft} plinthSqft={survey?.plinthSqft} />
          ) : (
            <LockedTab title="Area details" description="Plot area, floor rows, plinth, built-up and open land areas." />
          )}
        </TabsContent>

        {/* ── Photos ──────────────────────────────────────────────── */}
        <TabsContent value="photos" className="mt-0">
          {canEditSections && surveyId ? (
            <Card className="border-l-[3px] border-l-violet-500 bg-violet-50/30 dark:border-l-violet-400 dark:bg-violet-950/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-violet-800 dark:text-violet-300">
                  <Camera className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                  Survey Photos
                </CardTitle>
                <CardDescription>Front and side photos are required before submitting.</CardDescription>
              </CardHeader>
              <CardContent>
                <PhotoUploader surveyId={surveyId} />
              </CardContent>
            </Card>
          ) : (
            <LockedTab title="Photos" description="Upload front and side photos of the property." />
          )}
        </TabsContent>

        {/* ── GPS ─────────────────────────────────────────────────── */}
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
