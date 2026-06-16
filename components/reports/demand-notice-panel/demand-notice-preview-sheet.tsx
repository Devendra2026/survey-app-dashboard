"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { DemandRegisterRow } from "@/hooks/qc/useDemandNoticePanel";
import { formatAreaSqft } from "@/lib/survey/area";
import { ExternalLink, Printer } from "lucide-react";

export function DemandNoticePreviewSheet({
  row,
  open,
  onOpenChange,
}: {
  row: DemandRegisterRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const href = row ? `/qc/${row.surveyId}/demand-notice` : "#";
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Demand Notice Preview</SheetTitle>
          <SheetDescription>Open the full printable notice for this property.</SheetDescription>
        </SheetHeader>
        {row ? (
          <div className="space-y-3 px-4 text-sm">
            <div className="rounded-lg border border-border/70 p-3">
              <p className="font-semibold">{row.propertyId}</p>
              <p className="text-muted-foreground">{row.ownerName}</p>
            </div>
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-muted-foreground">Ward</dt>
                <dd className="font-medium">{row.wardNo}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Parcel</dt>
                <dd className="font-medium">{row.parcelNo}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Assessable Area</dt>
                <dd className="font-medium">{formatAreaSqft(row.assessableSqft)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Annual Demand</dt>
                <dd className="font-semibold">{row.annualDemandLabel}</dd>
              </div>
            </dl>
          </div>
        ) : null}
        <SheetFooter className="border-t border-border/70">
          <Button asChild variant="outline">
            <a href={href} target="_blank" rel="noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" /> Open Notice
            </a>
          </Button>
          <Button asChild>
            <a href={href} target="_blank" rel="noreferrer">
              <Printer className="mr-2 h-4 w-4" /> Print Notice
            </a>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
