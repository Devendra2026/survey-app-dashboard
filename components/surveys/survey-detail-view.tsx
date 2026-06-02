"use client";

import { RoleGate } from "@/components/shared/role-gate";
import { PropertyIdBanner, PropertyIdTableCell, PropertyIdTableHead } from "@/components/surveys/property-id-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuditLog } from "@/hooks/audit/useAudit";
import { useMasters } from "@/hooks/masters/useMasters";
import { GPS_ACCEPT_MAX_ACCURACY_METERS, SURVEY_STATUS_LABEL, type PhotoSlot } from "@/lib/domain";
import { formatAreaSqft, formatAreaSqMeter, surveyAreaMetrics } from "@/lib/survey/area";
import { labelFromOptions } from "@/lib/survey/detail-labels";
import { surveyCompletionPercent } from "@/lib/survey/progress";
import { buildUlbCodeMap, resolveDisplayPropertyId } from "@/lib/survey/resolve-display-property-id";
import { fmtDate } from "@/lib/utils";
import type { FloorRow, OwnerEntry, SurveyDetail } from "@/schema/surveys/index";
import { Crosshair, ImageOff, MapPin } from "lucide-react";

const DETAIL_PHOTO_LABEL: Record<PhotoSlot, string> = {
  front: "Front View (Street)",
  side: "Side View (Boundary)",
  inside: "",
  document: "",
};

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  const empty = value == null || value === "" || value === "—";
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`text-sm ${empty ? "text-muted-foreground" : "text-foreground"}`}>{empty ? "—" : value}</p>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border-border/70 shadow-sm ${className ?? ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FieldGrid({ children, cols = 3 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const colClass =
    cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return <div className={`grid gap-4 ${colClass}`}>{children}</div>;
}

function OccupancyBadge({ usageType }: { usageType: string }) {
  if (usageType === "self_occupied") {
    return (
      <Badge className="bg-emerald-600/15 text-emerald-700 hover:bg-emerald-600/15 dark:text-emerald-400">
        Self Occupied
      </Badge>
    );
  }
  if (usageType === "rented") {
    return (
      <Badge className="bg-violet-600/15 text-violet-700 hover:bg-violet-600/15 dark:text-violet-400">Rented</Badge>
    );
  }
  return <span className="text-sm text-muted-foreground">—</span>;
}

function GisPanel({ gps }: { gps: NonNullable<SurveyDetail["gps"]> }) {
  const lat = gps.latitude;
  const lng = gps.longitude;
  const googleEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=18&output=embed`;
  const accuracyOk = gps.accuracyMeters <= GPS_ACCEPT_MAX_ACCURACY_METERS;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-muted/30">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <iframe
          title="Property location map"
          src={googleEmbedUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute left-3 top-3">
          <Badge variant={accuracyOk ? "default" : "destructive"} className="font-mono text-[10px] uppercase">
            Accuracy: {gps.accuracyMeters.toFixed(1)}m
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-border bg-card p-3 text-xs">
        <div>
          <p className="text-muted-foreground">Latitude</p>
          <p className="font-mono font-medium">{lat.toFixed(6)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Longitude</p>
          <p className="font-mono font-medium">{lng.toFixed(6)}</p>
        </div>
        <div className="col-span-2">
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <MapPin className="h-3.5 w-3.5" /> Open in Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}

function DetailPhotoSlots({ photos, uploaderName }: { photos: SurveyDetail["photos"]; uploaderName?: string }) {
  const slots: PhotoSlot[] = ["front", "side"];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {slots.map((slot) => {
        const photo = photos.find((p) => p.slot === slot);
        return (
          <div
            key={slot}
            className="flex flex-col overflow-hidden rounded-lg border border-dashed border-border bg-muted/20"
          >
            <div className="relative aspect-4/3 w-full bg-muted">
              {photo?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt={DETAIL_PHOTO_LABEL[slot]} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
                  <ImageOff className="h-8 w-8 opacity-40" />
                  <p className="text-xs">No photo uploaded</p>
                </div>
              )}
            </div>
            <div className="border-t border-border px-3 py-2">
              <p className="text-sm font-medium">{DETAIL_PHOTO_LABEL[slot]}</p>
              {photo ? (
                <p className="text-[11px] text-muted-foreground">
                  {fmtDate(photo.capturedAt)}
                  {uploaderName ? ` · ${uploaderName}` : ""}
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">JPG/PNG · Max 5MB</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AreaSummaryGrid({ survey }: { survey: SurveyDetail }) {
  const areas = surveyAreaMetrics({
    plotSqft: survey.plotSqft,
    plinthSqft: survey.plinthSqft,
    floors: survey.floors,
  });
  return (
    <div className="grid gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 sm:grid-cols-2 lg:grid-cols-3">
      <DetailField label="Plot Area SqFt" value={areas.plotSqft > 0 ? areas.plotSqft.toLocaleString("en-IN") : "—"} />
      <DetailField label="Plot Area SqMeter" value={formatAreaSqMeter(areas.plotSqft)} />
      <DetailField
        label="Plinth Area SqFt"
        value={areas.plinthSqft > 0 ? areas.plinthSqft.toLocaleString("en-IN") : "—"}
      />
      <DetailField label="Plinth Area SqMeter" value={formatAreaSqMeter(areas.plinthSqft)} />
      <DetailField
        label="Total Built Up Area SqFt"
        value={areas.builtUpSqft > 0 ? areas.builtUpSqft.toLocaleString("en-IN") : "—"}
      />
      <DetailField label="Total Built Up Area SqMeter" value={formatAreaSqMeter(areas.builtUpSqft)} />
    </div>
  );
}

function FloorsTable({ floors, propertyId, masters }: { floors: FloorRow[]; propertyId?: string; masters: any }) {
  const areas = surveyAreaMetrics({ plotSqft: 0, plinthSqft: 0, floors });
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <PropertyIdTableHead />
              <TableHead>Floor</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Construction Type</TableHead>
              <TableHead className="text-right">Area (Sqft)</TableHead>
              <TableHead>Occupancy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {floors.map((f) => (
              <TableRow key={f._id}>
                <PropertyIdTableCell propertyId={propertyId} />
                <TableCell className="capitalize">{labelFromOptions(masters?.floors, f.floorName)}</TableCell>
                <TableCell className="capitalize">
                  {labelFromOptions(masters?.usageTypes, f.usageType) ||
                    labelFromOptions(masters?.usageFactors, f.usageFactor)}
                </TableCell>
                <TableCell className="capitalize">
                  {labelFromOptions(masters?.constructionTypes, f.constructionType)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{f.areaSqft.toLocaleString("en-IN")}</TableCell>
                <TableCell>
                  <OccupancyBadge usageType={f.usageType} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-sm font-semibold text-primary">
        TOTAL BUILT-UP AREA: {formatAreaSqft(areas.builtUpSqft).replace(" sq ft", " Sqft").toUpperCase()} (
        {formatAreaSqMeter(areas.builtUpSqft)})
      </p>
    </div>
  );
}

function AuditTable({ audit, propertyId }: { audit: any[]; propertyId?: string }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <PropertyIdTableHead />
          <TableHead>When</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Actor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {audit.map((a) => (
          <TableRow key={a._id}>
            <PropertyIdTableCell propertyId={propertyId} />
            <TableCell className="whitespace-nowrap text-muted-foreground">{fmtDate(a._creationTime)}</TableCell>
            <TableCell className="font-mono text-xs">{a.action}</TableCell>
            <TableCell>{a.actor?.name ?? "System"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function SurveyDetailView({
  survey,
  surveyId,
  remarks: _remarks,
}: {
  survey: SurveyDetail;
  surveyId: string;
  remarks?: unknown;
}) {
  const { masters } = useMasters();
  const audit = useAuditLog({ entity: "survey", entityId: surveyId, limit: 100 });
  const ulbCodes = buildUlbCodeMap(masters?.ulbs);
  const propertyId = resolveDisplayPropertyId(survey, ulbCodes) ?? survey.propertyId;
  const owners: OwnerEntry[] = survey.owners ?? [];
  const ulb = masters?.ulbs?.find((m: { _id: string }) => m._id === survey.municipalityId);
  const district = masters?.districts?.find(
    (d: { _id: string }) => d._id === (survey as { districtId?: string }).districtId,
  );
  const progress = surveyCompletionPercent(survey);
  const lbl = (opts: { value: string; label: string }[] | undefined, v?: string) => labelFromOptions(opts, v);
  const propertyTypeOptions = survey.propertyUse ? masters?.propertyUseSubcategories?.[survey.propertyUse] : undefined;

  return (
    <div className="space-y-5">
      <PropertyIdBanner
        propertyId={propertyId}
        className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40"
      />

      <SectionCard title="Property Identification" description="ULB, ward, parcel and generated Property ID.">
        <FieldGrid cols={4}>
          <DetailField label="ULB / Local Body" value={ulb?.name ?? survey.city} />
          <DetailField label="Ward Number" value={survey.wardNo} />
          <DetailField label="Sector / Zone" value={survey.sectorNo} />
          <DetailField label="Parcel Number" value={survey.parcelNo} />
          <DetailField label="Unit / Sub-No" value={survey.unitNo} />
          <DetailField label="Property ID (Old)" value={survey.oldPropertyNo} />
          <DetailField label="Constructed Year" value={survey.constructedYear} />
          <DetailField label="District" value={district?.name} />
          <DetailField label="Survey Status" value={SURVEY_STATUS_LABEL[survey.status]} />
          <DetailField label="Surveyor" value={survey.surveyor?.name} />
          <DetailField
            label="Slum Area"
            value={survey.isSlum ? "This property is located in a notified Slum Area." : "No"}
          />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Owner & Household" description="Respondent and co-owners from the mobile survey.">
        <FieldGrid>
          <DetailField label="Respondent Name" value={survey.respondentName} />
          <DetailField
            label="Mobile Number"
            value={survey.mobileNo ? `+91 ${survey.mobileNo.replace(/^\+?91/, "")}` : undefined}
          />
          <DetailField label="Family Size" value={survey.familySize} />
          <DetailField label="Relationship with Owner" value={lbl(masters?.relationships, survey.relationship)} />
          <DetailField label="Alt Mobile" value={survey.altMobileNo} />
          <DetailField label="Father / Husband Name" value={owners[0]?.fatherOrHusbandName} />
        </FieldGrid>
        {owners.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <PropertyIdTableHead />
                  <TableHead>Name</TableHead>
                  <TableHead>Father / Husband</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Alt Mobile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {owners.map((o, i) => (
                  <TableRow key={i}>
                    <PropertyIdTableCell propertyId={propertyId} />
                    <TableCell>{o.name || "—"}</TableCell>
                    <TableCell>{o.fatherOrHusbandName || "—"}</TableCell>
                    <TableCell className="tabular-nums">{o.mobileNo || "—"}</TableCell>
                    <TableCell className="tabular-nums">{o.altMobileNo || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <SectionCard title="Address" className="h-full">
          <FieldGrid cols={2}>
            <DetailField label="House / Door No" value={survey.houseNo} />
            <DetailField label="Colony / Society" value={survey.colonyName} />
            <DetailField label="Locality / Landmark" value={survey.locality} />
            <DetailField label="City" value={survey.city} />
            <DetailField label="Pin Code" value={survey.pinCode} />
          </FieldGrid>
        </SectionCard>

        <SectionCard title="GIS Mapping" className="h-full">
          {survey.gps ? (
            <GisPanel gps={survey.gps} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-12 text-muted-foreground">
              <Crosshair className="h-8 w-8 opacity-40" />
              <p className="text-sm">No GPS capture on this survey.</p>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Taxation & Usage">
        <FieldGrid>
          <DetailField label="Assessment Year" value={survey.assessmentYear} />
          <DetailField label="Ownership Type" value={lbl(masters?.ownershipTypes, survey.ownershipType)} />
          <DetailField label="Property Use" value={lbl(masters?.propertyUses, survey.propertyUse)} />
          <DetailField label="Property Type" value={lbl(propertyTypeOptions, survey.propertyType)} />
          <DetailField label="Situation" value={lbl(masters?.situations, survey.situation)} />
          <DetailField label="Road Type" value={lbl(masters?.roadTypes, survey.roadType)} />
          <DetailField label="Tax Rate Zone" value={lbl(masters?.taxRateZones, survey.taxRateZone)} />
        </FieldGrid>
      </SectionCard>

      <SectionCard
        title="Floor Details"
        description="Plot, plinth, and built-up totals (sq ft and sq m) plus floor rows from mobile."
      >
        <div className="space-y-4">
          <AreaSummaryGrid survey={survey} />
          {survey.floors?.length ? (
            <FloorsTable floors={survey.floors} propertyId={propertyId} masters={masters} />
          ) : (
            <p className="text-sm text-muted-foreground">No floors recorded.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Municipal Services">
        <FieldGrid cols={2}>
          <DetailField label="Water Connection?" value={survey.municipalWaterConnection ? "Yes" : "No"} />
          <DetailField label="Source of Water" value={lbl(masters?.waterSources, survey.waterSource)} />
          <DetailField label="Sanitation Type" value={lbl(masters?.sanitationTypes, survey.sanitationType)} />
          <DetailField label="Door-to-door collection active" value={survey.municipalWasteCollection ? "Yes" : "No"} />
          <DetailField label="Electricity Consumer No" value={survey.electricityNo} />
        </FieldGrid>
      </SectionCard>

      <SectionCard title="Photo Documentation">
        <DetailPhotoSlots photos={survey.photos ?? []} uploaderName={survey.surveyor?.name} />
      </SectionCard>

      <SectionCard title="Audit History">
        <RoleGate
          capability="audit.view"
          fallback={<p className="text-sm text-muted-foreground">Audit history is visible to administrators only.</p>}
        >
          {audit === undefined ? (
            <Skeleton className="h-24 w-full" />
          ) : audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit entries for this survey.</p>
          ) : (
            <AuditTable audit={audit} propertyId={propertyId} />
          )}
        </RoleGate>
      </SectionCard>

      <div className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-3 rounded-lg border border-border bg-card/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-50 flex-1 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Survey Progress: {progress}% Complete</p>
          <Progress value={progress} className="h-2" />
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated {fmtDate((survey as { clientUpdatedAt?: number }).clientUpdatedAt ?? survey._creationTime)}
          {survey.submittedAt ? ` · Submitted ${fmtDate(survey.submittedAt)}` : ""}
        </p>
      </div>
    </div>
  );
}
