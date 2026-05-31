"use client";

import { QcPanel } from "@/components/qc/qc-panel";
import { generateSurveyReportPdf } from "@/components/reports/queries/pdf";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { QcStatusBadge, SurveyStatusBadge } from "@/components/shared/status-badge";
import { PhotoGallery } from "@/components/surveys/photo-gallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuditLog } from "@/hooks/audit/useAudit";
import { useMasters } from "@/hooks/masters/useMasters";
import { useQcRemarks } from "@/hooks/qc/useQc";
import { useRemoveSurvey, useSurvey } from "@/hooks/surveys/useSurveys";
import { GPS_ACCEPT_MAX_ACCURACY_METERS, SURVEY_STATUS_LABEL } from "@/lib/domain";
import { parseConvexError } from "@/lib/errors";
import { fmtDate } from "@/lib/utils";
import { ArrowLeft, Download, MapPin, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use } from "react";
import { toast } from "sonner";

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{value == null || value === "" ? "—" : String(value)}</p>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export default function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const survey = useSurvey(id);
  const { masters } = useMasters();
  const remarks = useQcRemarks(id);
  const audit = useAuditLog({ entity: "survey", entityId: id, limit: 100 });
  const removeSurvey = useRemoveSurvey();

  if (survey === undefined) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (survey === null) {
    return <EmptyState title="Survey not found" description="It may have been deleted or is outside your scope." />;
  }

  const owners = survey.owners ?? [];
  const ulb = masters?.ulbs?.find((m: { _id: string }) => m._id === survey.municipalityId);
  const district = masters?.districts?.find(
    (d: { _id: string }) => d._id === (survey as { districtId?: string }).districtId,
  );

  async function onDelete() {
    if (!confirm("Delete this survey? This cannot be undone.")) return;
    try {
      await removeSurvey({ id: id as any });
      toast.success("Survey deleted");
      router.push("/surveys");
    } catch (e) {
      toast.error(parseConvexError(e).message);
    }
  }

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/surveys">
          <ArrowLeft className="h-4 w-4" /> Back to surveys
        </Link>
      </Button>

      <PageHeader
        title={survey.propertyId || `Parcel ${survey.parcelNo}`}
        description={`${survey.city} · Ward ${survey.wardNo} · ${survey.locality ?? ""}`}
        actions={
          <div className="flex items-center gap-2">
            <SurveyStatusBadge status={survey.status} />
            <QcStatusBadge status={survey.qcStatus} />
            <Button variant="outline" size="sm" onClick={() => generateSurveyReportPdf(survey)}>
              <Download className="h-4 w-4" /> PDF
            </Button>
            <RoleGate capability="surveys.editDraft">
              {survey.qcStatus !== "approved" && (
                <Button asChild variant="default" size="sm">
                  <Link href={`/surveys/${id}/edit`}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Link>
                </Button>
              )}
            </RoleGate>
            <RoleGate capability="surveys.delete">
              {survey.qcStatus !== "approved" && (
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </RoleGate>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div>
          <Tabs defaultValue="overview">
            <div className="-mx-1 overflow-x-auto pb-1">
              <TabsList className="inline-flex w-max min-w-full flex-nowrap sm:min-w-0">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="owner">Owner</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="taxation">Taxation</TabsTrigger>
                <TabsTrigger value="floors">Floors</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="gis">GIS</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="qc">QC History</TabsTrigger>
                <TabsTrigger value="audit">Audit</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview">
              <Card>
                <CardContent className="pt-5">
                  <Grid>
                    <Field label="District" value={district?.name ?? "—"} />
                    <Field label="ULB / Municipality" value={ulb?.name ?? survey.city} />
                    <Field label="Ward" value={survey.wardNo} />
                    <Field label="Property ID" value={survey.propertyId} />
                    <Field label="Parcel No" value={survey.parcelNo} />
                    <Field label="Unit No" value={survey.unitNo} />
                    <Field label="Sector No" value={survey.sectorNo} />
                    <Field label="Old Property No" value={survey.oldPropertyNo} />
                    <Field label="Constructed Year" value={survey.constructedYear} />
                    <Field label="Slum" value={survey.isSlum ? "Yes" : "No"} />
                    <Field label="Survey Status" value={SURVEY_STATUS_LABEL[survey.status]} />
                    <Field label="Surveyor" value={survey.surveyor?.name} />
                    <Field label="Last Updated" value={fmtDate(survey.clientUpdatedAt)} />
                    <Field label="Submitted" value={survey.submittedAt ? fmtDate(survey.submittedAt) : "—"} />
                  </Grid>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="owner">
              <Card>
                <CardContent className="space-y-4 pt-5">
                  <Grid>
                    <Field label="Respondent" value={survey.respondentName} />
                    <Field label="Relationship" value={survey.relationship} />
                    <Field label="Family Size" value={survey.familySize} />
                    <Field label="Primary Mobile" value={survey.mobileNo} />
                    <Field label="Alt Mobile" value={survey.altMobileNo} />
                  </Grid>
                  {owners.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Co-owners ({owners.length})
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Father/Husband</TableHead>
                            <TableHead>Mobile</TableHead>
                            <TableHead>Alt Mobile</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {owners.map((o: any, i: number) => (
                            <TableRow key={i}>
                              <TableCell>{o.name || "—"}</TableCell>
                              <TableCell>{o.fatherOrHusbandName || "—"}</TableCell>
                              <TableCell>{o.mobileNo || "—"}</TableCell>
                              <TableCell>{o.altMobileNo || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="address">
              <Card>
                <CardContent className="pt-5">
                  <Grid>
                    <Field label="House No" value={survey.houseNo} />
                    <Field label="Locality" value={survey.locality} />
                    <Field label="Colony" value={survey.colonyName} />
                    <Field label="City / ULB" value={survey.city} />
                    <Field label="PIN Code" value={survey.pinCode} />
                  </Grid>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="taxation">
              <Card>
                <CardContent className="pt-5">
                  <Grid>
                    <Field label="Assessment Year" value={survey.assessmentYear} />
                    <Field label="Ownership Type" value={survey.ownershipType} />
                    <Field label="Property Use" value={survey.propertyUse} />
                    <Field label="Property Type" value={survey.propertyType} />
                    <Field label="Situation" value={survey.situation} />
                    <Field label="Road Type" value={survey.roadType} />
                    <Field label="Tax Rate Zone" value={survey.taxRateZone} />
                    <Field label="Plot (sqft)" value={survey.plotSqft} />
                    <Field label="Plinth (sqft)" value={survey.plinthSqft} />
                  </Grid>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="floors">
              <Card>
                <CardContent className="pt-5">
                  {survey.floors?.length ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Floor</TableHead>
                          <TableHead>Usage Factor</TableHead>
                          <TableHead>Usage</TableHead>
                          <TableHead>Construction</TableHead>
                          <TableHead>Occupied</TableHead>
                          <TableHead>Area (sqft)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {survey.floors.map((f: any) => (
                          <TableRow key={f._id}>
                            <TableCell>{f.position}</TableCell>
                            <TableCell className="capitalize">{f.floorName}</TableCell>
                            <TableCell className="capitalize">{f.usageFactor?.replace(/_/g, " ") ?? "—"}</TableCell>
                            <TableCell className="capitalize">{f.usageType?.replace(/_/g, " ")}</TableCell>
                            <TableCell className="capitalize">{f.constructionType?.replace(/_/g, " ")}</TableCell>
                            <TableCell>{f.isOccupied ? "Yes" : "No"}</TableCell>
                            <TableCell className="tabular-nums">{f.areaSqft}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No floors recorded.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services">
              <Card>
                <CardContent className="pt-5">
                  <Grid>
                    <Field label="Municipal Water Connection" value={survey.municipalWaterConnection ? "Yes" : "No"} />
                    <Field label="Water Source" value={survey.waterSource} />
                    <Field label="Sanitation Type" value={survey.sanitationType} />
                    <Field label="Waste Collection" value={survey.municipalWasteCollection ? "Yes" : "No"} />
                    <Field label="Electricity No" value={survey.electricityNo} />
                  </Grid>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gis">
              <Card>
                <CardContent className="pt-5">
                  {survey.gps ? (
                    <Grid>
                      <Field label="Latitude" value={survey.gps.latitude} />
                      <Field label="Longitude" value={survey.gps.longitude} />
                      <Field
                        label="Accuracy (m)"
                        value={`±${survey.gps.accuracyMeters} ${survey.gps.accuracyMeters > GPS_ACCEPT_MAX_ACCURACY_METERS ? "(out of tolerance)" : ""}`}
                      />
                      <Field label="Captured" value={fmtDate(survey.gps.capturedAt)} />
                      <Field label="Provider" value={survey.gps.provider} />
                      <Field label="Mock Location" value={survey.gps.isMockLocation ? "Yes ⚠" : "No"} />
                      <div className="sm:col-span-3">
                        <a
                          href={`https://www.google.com/maps?q=${survey.gps.latitude},${survey.gps.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <MapPin className="h-4 w-4" /> Open in Google Maps
                        </a>
                      </div>
                    </Grid>
                  ) : (
                    <p className="text-sm text-muted-foreground">No GPS capture on this survey.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos">
              <Card>
                <CardContent className="pt-5">
                  <PhotoGallery photos={(survey.photos ?? []) as any} uploaderName={survey.surveyor?.name} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qc">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">QC History</CardTitle>
                </CardHeader>
                <CardContent>
                  {remarks === undefined ? (
                    <Skeleton className="h-24 w-full" />
                  ) : remarks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No QC remarks recorded.</p>
                  ) : (
                    <div className="space-y-3">
                      {remarks.map((r: any) => (
                        <div key={r._id} className="rounded-md border border-border p-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {r.author?.name} · {r.authorRole} · {r.status}
                            </span>
                            <span>{fmtDate(r._creationTime)}</span>
                          </div>
                          <p className="mt-1 text-sm">{r.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Audit History</CardTitle>
                </CardHeader>
                <CardContent>
                  <RoleGate
                    capability="audit.view"
                    fallback={
                      <p className="text-sm text-muted-foreground">Audit history is visible to administrators only.</p>
                    }
                  >
                    {audit === undefined ? (
                      <Skeleton className="h-24 w-full" />
                    ) : audit.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No audit entries for this survey.</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>When</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Actor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {audit.map((a: any) => (
                            <TableRow key={a._id}>
                              <TableCell className="whitespace-nowrap text-muted-foreground">
                                {fmtDate(a._creationTime)}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{a.action}</TableCell>
                              <TableCell>{a.actor?.name ?? "System"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </RoleGate>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* QC sidebar — review/decision + remark thread */}
        <RoleGate anyOf={["qc.review", "qc.decide"]}>
          <QcPanel survey={survey} />
        </RoleGate>
      </div>
    </div>
  );
}
