"use client";

import { RoleGate } from "@/components/shared/role-gate";
import { PropertyIdTableCell, PropertyIdTableHead } from "@/components/surveys/property-id-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuditLog } from "@/hooks/audit/useAudit";
import { useMasters } from "@/hooks/masters/useMasters";
import { GPS_ACCEPT_MAX_ACCURACY_METERS, SURVEY_STATUS_LABEL, type PhotoSlot } from "@/lib/domain";
import { formatAreaSqMeter, surveyAreaMetrics } from "@/lib/survey/area";
import { labelFromOptions } from "@/lib/survey/detail-labels";
import { surveyCompletionPercent } from "@/lib/survey/progress";
import { buildUlbCodeMap, resolveDisplayPropertyId } from "@/lib/survey/resolve-display-property-id";
import { fmtDate } from "@/lib/utils";
import type { FloorRow, OwnerEntry, SurveyDetail } from "@/schema/surveys/index";
import {
  Building2,
  Camera,
  ClipboardList,
  Crosshair,
  ExternalLink,
  ImageOff,
  Layers,
  MapPin,
  MapPinHouse,
  Receipt,
  Users,
  Zap,
} from "lucide-react";

/* ─── Photo slot labels ─────────────────────────────────────────── */
const PHOTO_LABEL: Record<PhotoSlot, string> = {
  front: "Front View",
  side: "Side View",
  inside: "Inside View",
  document: "Document",
};

/* ─── Section colour palette ────────────────────────────────────── */
const SC = {
  blue: {
    border: "border-l-[3px] border-l-blue-500   dark:border-l-blue-400",
    bg: "bg-blue-50/40   dark:bg-blue-950/20",
    title: "text-blue-800   dark:text-blue-300",
    icon: "text-blue-500   dark:text-blue-400",
  },
  violet: {
    border: "border-l-[3px] border-l-violet-500 dark:border-l-violet-400",
    bg: "bg-violet-50/40 dark:bg-violet-950/20",
    title: "text-violet-800 dark:text-violet-300",
    icon: "text-violet-500 dark:text-violet-400",
  },
  emerald: {
    border: "border-l-[3px] border-l-emerald-500 dark:border-l-emerald-400",
    bg: "bg-emerald-50/40 dark:bg-emerald-950/20",
    title: "text-emerald-800 dark:text-emerald-300",
    icon: "text-emerald-500 dark:text-emerald-400",
  },
  sky: {
    border: "border-l-[3px] border-l-sky-500    dark:border-l-sky-400",
    bg: "bg-sky-50/40    dark:bg-sky-950/20",
    title: "text-sky-800    dark:text-sky-300",
    icon: "text-sky-500    dark:text-sky-400",
  },
  amber: {
    border: "border-l-[3px] border-l-amber-500  dark:border-l-amber-400",
    bg: "bg-amber-50/40  dark:bg-amber-950/20",
    title: "text-amber-800  dark:text-amber-300",
    icon: "text-amber-500  dark:text-amber-400",
  },
  orange: {
    border: "border-l-[3px] border-l-orange-500 dark:border-l-orange-400",
    bg: "bg-orange-50/40 dark:bg-orange-950/20",
    title: "text-orange-800 dark:text-orange-300",
    icon: "text-orange-500 dark:text-orange-400",
  },
  cyan: {
    border: "border-l-[3px] border-l-cyan-500   dark:border-l-cyan-400",
    bg: "bg-cyan-50/40   dark:bg-cyan-950/20",
    title: "text-cyan-800   dark:text-cyan-300",
    icon: "text-cyan-500   dark:text-cyan-400",
  },
  purple: {
    border: "border-l-[3px] border-l-purple-500 dark:border-l-purple-400",
    bg: "bg-purple-50/40 dark:bg-purple-950/20",
    title: "text-purple-800 dark:text-purple-300",
    icon: "text-purple-500 dark:text-purple-400",
  },
  slate: {
    border: "border-l-[3px] border-l-slate-400  dark:border-l-slate-500",
    bg: "bg-slate-50/40  dark:bg-slate-900/20",
    title: "text-slate-700  dark:text-slate-300",
    icon: "text-slate-500  dark:text-slate-400",
  },
} as const;
type SColor = keyof typeof SC;

/* ─── Section card ──────────────────────────────────────────────── */
function SectionCard({
  title,
  description,
  children,
  className,
  icon,
  color = "slate",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  color?: SColor;
}) {
  const s = SC[color];
  return (
    <Card className={`${s.border} ${s.bg} shadow-sm ${className ?? ""}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-base font-semibold ${s.title}`}>
          {icon && <span className={s.icon}>{icon}</span>}
          {title}
        </CardTitle>
        {description && <CardDescription className="text-xs">{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/* ─── Field card ────────────────────────────────────────────────── */
function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  const empty = value == null || value === "" || value === "—";
  return (
    <div className="rounded-lg bg-background/70 px-3 py-2.5 ring-1 ring-border/50 dark:bg-muted/10 dark:ring-border/30">
      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
      <p
        className={`text-sm font-medium leading-snug ${empty ? "italic text-muted-foreground/40" : "text-foreground"}`}
      >
        {empty ? "—" : value}
      </p>
    </div>
  );
}

/* ─── Field grid ────────────────────────────────────────────────── */
function FieldGrid({ children, cols = 3 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  const cls =
    cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return <div className={`grid gap-3 ${cls}`}>{children}</div>;
}

/* ─── Occupancy badge ───────────────────────────────────────────── */
function OccupancyBadge({ usageType }: { usageType: string }) {
  if (usageType === "self_occupied")
    return (
      <Badge className="bg-emerald-600/15 text-emerald-700 hover:bg-emerald-600/15 dark:text-emerald-400">
        Self Occupied
      </Badge>
    );
  if (usageType === "rented")
    return (
      <Badge className="bg-violet-600/15 text-violet-700 hover:bg-violet-600/15 dark:text-violet-400">Rented</Badge>
    );
  return <span className="text-sm text-muted-foreground">—</span>;
}

/* ─── GPS panel ─────────────────────────────────────────────────── */
function GisPanel({ gps }: { gps: NonNullable<SurveyDetail["gps"]> }) {
  const lat = gps.latitude;
  const lng = gps.longitude;
  const googleEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=18&output=embed`;
  const accuracyOk = gps.accuracyMeters <= GPS_ACCEPT_MAX_ACCURACY_METERS;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/60">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <iframe
          title="Property location map"
          src={googleEmbedUrl}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute left-3 top-3">
          <Badge variant={accuracyOk ? "default" : "destructive"} className="font-mono text-[10px] uppercase shadow-sm">
            ±{gps.accuracyMeters.toFixed(1)} m
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border/50 border-t border-border/50 bg-card">
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Latitude</p>
          <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{lat.toFixed(6)}</p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Longitude</p>
          <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{lng.toFixed(6)}</p>
        </div>
        <div className="flex items-center px-3 py-2.5">
          <a
            href={`https://www.google.com/maps?q=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> Maps
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Area summary grid ─────────────────────────────────────────── */
function AreaMetricCard({
  label,
  sqft,
  sqm,
  color,
}: {
  label: string;
  sqft: number;
  sqm: string;
  color: "blue" | "violet" | "emerald";
}) {
  const styles = {
    blue: "border-blue-200/60   bg-blue-50/60   text-blue-800   dark:border-blue-800/40   dark:bg-blue-950/30   dark:text-blue-300",
    violet:
      "border-violet-200/60 bg-violet-50/60 text-violet-800 dark:border-violet-800/40 dark:bg-violet-950/30 dark:text-violet-300",
    emerald:
      "border-emerald-200/60 bg-emerald-50/60 text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300",
  };
  return (
    <div className={`rounded-xl border p-3 ${styles[color]}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{label}</p>
      <p className="mt-1.5 text-xl font-black tabular-nums leading-none">
        {sqft > 0 ? sqft.toLocaleString("en-IN") : "—"}
      </p>
      <p className="mt-0.5 text-xs opacity-60">{sqft > 0 ? sqm : "—"}</p>
    </div>
  );
}

function AreaSummaryGrid({ survey }: { survey: SurveyDetail }) {
  const areas = surveyAreaMetrics({ plotSqft: survey.plotSqft, plinthSqft: survey.plinthSqft, floors: survey.floors });
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <AreaMetricCard label="Plot Area" sqft={areas.plotSqft} sqm={formatAreaSqMeter(areas.plotSqft)} color="blue" />
      <AreaMetricCard
        label="Plinth Area"
        sqft={areas.plinthSqft}
        sqm={formatAreaSqMeter(areas.plinthSqft)}
        color="violet"
      />
      <AreaMetricCard
        label="Built-up Area"
        sqft={areas.builtUpSqft}
        sqm={formatAreaSqMeter(areas.builtUpSqft)}
        color="emerald"
      />
    </div>
  );
}

/* ─── Floors table ──────────────────────────────────────────────── */
function FloorsTable({ floors, propertyId, masters }: { floors: FloorRow[]; propertyId?: string; masters: any }) {
  const areas = surveyAreaMetrics({ plotSqft: 0, plinthSqft: 0, floors });
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/60 bg-linear-to-r from-orange-50 to-amber-50/40 hover:from-orange-50 dark:from-orange-950/30 dark:to-amber-950/10 dark:hover:from-orange-950/30">
              <PropertyIdTableHead />
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-orange-700/70 dark:text-orange-400/70">
                Floor
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-orange-700/70 dark:text-orange-400/70">
                Usage
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-orange-700/70 dark:text-orange-400/70">
                Construction
              </TableHead>
              <TableHead className="text-right text-[10px] font-bold uppercase tracking-wider text-orange-700/70 dark:text-orange-400/70">
                Area (Sqft)
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-orange-700/70 dark:text-orange-400/70">
                Occupancy
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {floors.map((f, i) => (
              <TableRow
                key={f._id}
                className={`border-b border-border/40 last:border-b-0 ${i % 2 === 0 ? "bg-background" : "bg-muted/20 dark:bg-muted/10"}`}
              >
                <PropertyIdTableCell propertyId={propertyId} />
                <TableCell className="font-medium capitalize">
                  {labelFromOptions(masters?.floors, f.floorName)}
                </TableCell>
                <TableCell className="capitalize text-muted-foreground">
                  {labelFromOptions(masters?.usageTypes, f.usageType) ||
                    labelFromOptions(masters?.usageFactors, f.usageFactor)}
                </TableCell>
                <TableCell className="capitalize text-muted-foreground">
                  {labelFromOptions(masters?.constructionTypes, f.constructionType)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold tabular-nums">
                  {f.areaSqft.toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  <OccupancyBadge usageType={f.usageType} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-orange-200/60 bg-orange-50/60 px-4 py-2.5 dark:border-orange-800/30 dark:bg-orange-950/20">
        <span className="text-xs font-bold uppercase tracking-wider text-orange-700/70 dark:text-orange-400/60">
          Total Built-up Area
        </span>
        <span className="font-mono text-sm font-black text-orange-800 dark:text-orange-300">
          {areas.builtUpSqft > 0
            ? `${areas.builtUpSqft.toLocaleString("en-IN")} Sqft · ${formatAreaSqMeter(areas.builtUpSqft)}`
            : "—"}
        </span>
      </div>
    </div>
  );
}

/* ─── Audit table ───────────────────────────────────────────────── */
function AuditTable({ audit, propertyId }: { audit: any[]; propertyId?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/60 bg-muted/40 hover:bg-muted/40 dark:bg-muted/20">
            <PropertyIdTableHead />
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              When
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Action
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Actor
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {audit.map((a, i) => (
            <TableRow
              key={a._id}
              className={`border-b border-border/40 last:border-b-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
            >
              <PropertyIdTableCell propertyId={propertyId} />
              <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                {fmtDate(a._creationTime)}
              </TableCell>
              <TableCell>
                <span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono text-xs dark:bg-muted/30">
                  {a.action}
                </span>
              </TableCell>
              <TableCell className="font-medium">{a.actor?.name ?? "System"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ─── Photo slots ───────────────────────────────────────────────── */
function DetailPhotoSlots({ photos, uploaderName }: { photos: SurveyDetail["photos"]; uploaderName?: string }) {
  const slots: PhotoSlot[] = ["front", "side", "inside", "document"];
  const uploadedCount = slots.filter((s) => photos.find((p) => p.slot === s)?.url).length;
  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-700/60 dark:text-purple-400/60">
              Photos uploaded
            </p>
            <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
              {uploadedCount}/{slots.length}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-purple-100 dark:bg-purple-900/30">
            <div
              className="h-full rounded-full bg-linear-to-r from-purple-500 to-violet-500 transition-all"
              style={{ width: `${(uploadedCount / slots.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      {/* Photo grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {slots.map((slot) => {
          const photo = photos.find((p) => p.slot === slot);
          const required = slot === "front" || slot === "side";
          return (
            <div
              key={slot}
              className={`group flex flex-col overflow-hidden rounded-xl shadow-sm transition-shadow hover:shadow-md ${
                photo?.url
                  ? "border border-purple-200/60 dark:border-purple-800/40"
                  : required
                    ? "border border-dashed border-amber-300/70 dark:border-amber-700/50"
                    : "border border-dashed border-border/50"
              }`}
            >
              <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/50">
                {photo?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.url}
                    alt={PHOTO_LABEL[slot]}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ImageOff className="h-8 w-8 opacity-25" />
                    <p className="text-[11px] font-medium opacity-50">No photo</p>
                  </div>
                )}
                {/* Required badge */}
                {required && !photo?.url && (
                  <div className="absolute right-2 top-2">
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      Required
                    </span>
                  </div>
                )}
                {/* Uploaded badge */}
                {photo?.url && (
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      View
                    </span>
                  </div>
                )}
              </div>
              <div className="border-t border-border/40 bg-background/60 px-3 py-2 dark:bg-card/60">
                <p className="text-xs font-semibold text-foreground">{PHOTO_LABEL[slot]}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {photo ? `${fmtDate(photo.capturedAt)}${uploaderName ? ` · ${uploaderName}` : ""}` : "Not uploaded"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main component ────────────────────────────────────────────── */
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
    <div className="space-y-4">
      {/* ── Property Identification ────────────────────────────── */}
      <SectionCard
        title="Property Identification"
        description="ULB, ward, parcel and generated Property ID."
        icon={<Building2 className="h-4 w-4" />}
        color="blue"
      >
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
          <DetailField label="Slum Area" value={survey.isSlum ? "Yes — notified slum" : "No"} />
        </FieldGrid>
      </SectionCard>

      {/* ── Owner & Household ─────────────────────────────────── */}
      <SectionCard
        title="Owner & Household"
        description="Respondent and co-owners from the mobile survey."
        icon={<Users className="h-4 w-4" />}
        color="violet"
      >
        <FieldGrid>
          <DetailField label="Respondent Name" value={survey.respondentName} />
          <DetailField
            label="Mobile Number"
            value={survey.mobileNo ? `+91 ${survey.mobileNo.replace(/^\+?91/, "")}` : undefined}
          />
          <DetailField label="Family Size" value={survey.familySize} />
          <DetailField label="Relationship w/ Owner" value={lbl(masters?.relationships, survey.relationship)} />
          <DetailField label="Alt Mobile" value={survey.altMobileNo} />
          <DetailField label="Father / Husband Name" value={owners[0]?.fatherOrHusbandName} />
        </FieldGrid>
        {owners.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="bg-violet-50/60 hover:bg-violet-50/60 dark:bg-violet-950/20 dark:hover:bg-violet-950/20">
                  <PropertyIdTableHead />
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-violet-700/70 dark:text-violet-400/70">
                    Name
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-violet-700/70 dark:text-violet-400/70">
                    Father / Husband
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-violet-700/70 dark:text-violet-400/70">
                    Mobile
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-wider text-violet-700/70 dark:text-violet-400/70">
                    Alt Mobile
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {owners.map((o, i) => (
                  <TableRow key={i} className="border-b border-border/40 last:border-b-0">
                    <PropertyIdTableCell propertyId={propertyId} />
                    <TableCell className="font-medium">{o.name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{o.fatherOrHusbandName || "—"}</TableCell>
                    <TableCell className="tabular-nums">{o.mobileNo || "—"}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">{o.altMobileNo || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>

      {/* ── Address + GIS ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Address" icon={<MapPinHouse className="h-4 w-4" />} color="emerald" className="h-full">
          <FieldGrid cols={2}>
            <DetailField label="House / Door No" value={survey.houseNo} />
            <DetailField label="Colony / Society" value={survey.colonyName} />
            <DetailField label="Locality / Landmark" value={survey.locality} />
            <DetailField label="City" value={survey.city} />
            <DetailField label="Pin Code" value={survey.pinCode} />
          </FieldGrid>
        </SectionCard>

        <SectionCard title="GIS Mapping" icon={<MapPin className="h-4 w-4" />} color="sky" className="h-full">
          {survey.gps ? (
            <GisPanel gps={survey.gps} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/50 py-14 text-muted-foreground">
              <Crosshair className="h-8 w-8 opacity-30" />
              <p className="text-sm font-medium opacity-60">No GPS captured</p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Taxation & Usage ──────────────────────────────────── */}
      <SectionCard title="Taxation & Usage" icon={<Receipt className="h-4 w-4" />} color="amber">
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

      {/* ── Floor Details ─────────────────────────────────────── */}
      <SectionCard
        title="Floor Details"
        description="Plot, plinth and built-up areas plus per-floor breakdown."
        icon={<Layers className="h-4 w-4" />}
        color="orange"
      >
        <div className="space-y-4">
          <AreaSummaryGrid survey={survey} />
          {survey.floors?.length ? (
            <FloorsTable floors={survey.floors} propertyId={propertyId} masters={masters} />
          ) : (
            <p className="rounded-lg border border-dashed border-border/50 px-4 py-6 text-center text-sm text-muted-foreground">
              No floor records
            </p>
          )}
        </div>
      </SectionCard>

      {/* ── Municipal Services ────────────────────────────────── */}
      <SectionCard title="Municipal Services" icon={<Zap className="h-4 w-4" />} color="cyan">
        <FieldGrid cols={2}>
          <DetailField label="Water Connection" value={survey.municipalWaterConnection ? "Yes" : "No"} />
          <DetailField label="Source of Water" value={lbl(masters?.waterSources, survey.waterSource)} />
          <DetailField label="Sanitation Type" value={lbl(masters?.sanitationTypes, survey.sanitationType)} />
          <DetailField label="Door-to-door Collection" value={survey.municipalWasteCollection ? "Yes" : "No"} />
          <DetailField label="Electricity Consumer No" value={survey.electricityNo} />
        </FieldGrid>
      </SectionCard>

      {/* ── Photo Documentation ───────────────────────────────── */}
      <SectionCard
        title="Photo Documentation"
        description="Front and side photos are required. Inside and document are optional."
        icon={<Camera className="h-4 w-4" />}
        color="purple"
      >
        <DetailPhotoSlots photos={survey.photos ?? []} uploaderName={survey.surveyor?.name} />
      </SectionCard>

      {/* ── Audit History ─────────────────────────────────────── */}
      <SectionCard title="Audit History" icon={<ClipboardList className="h-4 w-4" />} color="slate">
        <RoleGate capability="audit.view" deniedDescription="Audit history is visible to administrators only.">
          {audit === undefined ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : audit.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/50 px-4 py-6 text-center text-sm text-muted-foreground">
              No audit entries
            </p>
          ) : (
            <AuditTable audit={audit} propertyId={propertyId} />
          )}
        </RoleGate>
      </SectionCard>

      {/* ── Sticky progress footer ────────────────────────────── */}
      <div className="sticky bottom-0 z-10 -mx-1 overflow-hidden rounded-2xl border border-primary/20 bg-card/95 shadow-xl backdrop-blur-sm">
        <div className="h-1 w-full bg-muted">
          <div
            className="h-full bg-linear-to-r from-indigo-500 via-blue-500 to-sky-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-blue-600 text-sm font-black text-white shadow-sm">
              {progress}
            </div>
            <div>
              <p className="text-xs font-bold text-primary">Survey Completion</p>
              <p className="text-[11px] text-muted-foreground">{progress}% of all fields filled</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <p className="text-[11px] text-muted-foreground">
              Updated {fmtDate((survey as { clientUpdatedAt?: number }).clientUpdatedAt ?? survey._creationTime)}
            </p>
            {survey.submittedAt && (
              <p className="text-[11px] font-semibold text-primary/80">Submitted {fmtDate(survey.submittedAt)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
