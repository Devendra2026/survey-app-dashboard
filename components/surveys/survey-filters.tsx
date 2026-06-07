"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMasters, useWardsForMunicipality } from "@/hooks/masters/useMasters";
import { QC_STATUSES, QC_STATUS_LABEL, SURVEY_STATUSES, SURVEY_STATUS_LABEL } from "@/lib/domain";
import { CalendarDays, RotateCcw, Search } from "lucide-react";

export interface FilterState {
  search: string;
  districtId?: string;
  municipalityId?: string;
  wardNo?: string;
  status?: string;
  qcStatus?: string;
  month?: string;
  fromDate?: string;
  toDate?: string;
}

const ALL = "__all__";

function pickFilterValue(v: string) {
  return v === ALL ? undefined : v;
}

export function SurveyFilters({
  value,
  onChange,
  showStatus = true,
  showQcStatus = true,
}: {
  value: FilterState;
  onChange: (next: FilterState) => void;
  showStatus?: boolean;
  showQcStatus?: boolean;
}) {
  const { masters } = useMasters();
  const wardsForMuni = useWardsForMunicipality(value.municipalityId);
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });
  const setMonth = (month: string | undefined) => {
    if (!month) {
      set({ month: undefined, fromDate: undefined, toDate: undefined });
      return;
    }
    const [yearRaw, monthRaw] = month.split("-");
    const year = Number(yearRaw);
    const monthNum = Number(monthRaw);
    if (!year || Number.isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      set({ month: undefined, fromDate: undefined, toDate: undefined });
      return;
    }
    const mm = String(monthNum).padStart(2, "0");
    const lastDay = new Date(year, monthNum, 0).getDate();
    const fromDate = `${year}-${mm}-01`;
    const toDate = `${year}-${mm}-${String(lastDay).padStart(2, "0")}`;
    set({ month, fromDate, toDate });
  };

  const wardsInScope = value.municipalityId ? (wardsForMuni ?? []) : [];
  const ulbsInScope = (masters?.ulbs ?? []).filter((m: any) => !value.districtId || m.districtId === value.districtId);
  const hasActiveFilters = Boolean(
    value.search ||
    value.districtId ||
    value.municipalityId ||
    value.wardNo ||
    value.status ||
    value.qcStatus ||
    value.month ||
    value.fromDate ||
    value.toDate,
  );
  const activeFilterCount = [
    value.search,
    value.districtId,
    value.municipalityId,
    value.wardNo,
    value.status,
    value.qcStatus,
    value.month || value.fromDate || value.toDate,
  ].filter(Boolean).length;

  const applyMonthOffset = (offset: number) => {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const clearAll = () => {
    onChange({ search: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/15 bg-linear-to-r from-primary/10 via-card to-card px-3 py-2 dark:from-primary/20 dark:via-primary/5">
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">Filter Control Panel</span>
          <Badge variant="secondary">{activeFilterCount} active</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => applyMonthOffset(0)}>
            This month
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => applyMonthOffset(-1)}>
            Last month
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => applyMonthOffset(-2)}>
            2 months back
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={clearAll} disabled={!hasActiveFilters}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-border/70 bg-background/40 p-3 md:grid-cols-2 xl:grid-cols-4 dark:bg-background/20">
        <div className="space-y-1.5 md:col-span-2 xl:col-span-4">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search Property ID, owner, mobile, parcel…"
              className="h-10 rounded-lg border-primary/20 bg-background pl-9"
              value={value.search}
              onChange={(e) => set({ search: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">District</Label>
          <Select
            value={value.districtId ?? ALL}
            onValueChange={(v) => set({ districtId: pickFilterValue(v), municipalityId: undefined, wardNo: undefined })}
          >
            <SelectTrigger className="h-10 w-full rounded-lg border-primary/20">
              <SelectValue placeholder="District" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All districts</SelectItem>
              {masters?.districts.map((d: any) => (
                <SelectItem key={d._id} value={d._id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">ULB</Label>
          <Select
            value={value.municipalityId ?? ALL}
            onValueChange={(v) => set({ municipalityId: pickFilterValue(v), wardNo: undefined })}
          >
            <SelectTrigger className="h-10 w-full rounded-lg border-primary/20">
              <SelectValue placeholder="ULB" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All ULBs</SelectItem>
              {ulbsInScope.map((m: any) => (
                <SelectItem key={m._id} value={m._id}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ward</Label>
          <Select
            value={value.wardNo ?? ALL}
            onValueChange={(v) => set({ wardNo: pickFilterValue(v) })}
            disabled={!value.municipalityId}
          >
            <SelectTrigger className="h-10 w-full rounded-lg border-primary/20">
              <SelectValue placeholder={value.municipalityId ? "Ward" : "Select ULB first"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All wards</SelectItem>
              {wardsInScope.map((w) => (
                <SelectItem key={w._id} value={w.wardNo}>
                  Ward {w.wardNo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {showStatus && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Survey Status</Label>
            <Select value={value.status ?? ALL} onValueChange={(v) => set({ status: pickFilterValue(v) })}>
              <SelectTrigger className="h-10 w-full rounded-lg border-primary/20">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any status</SelectItem>
                {SURVEY_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SURVEY_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showQcStatus && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">QC Status</Label>
            <Select value={value.qcStatus ?? ALL} onValueChange={(v) => set({ qcStatus: pickFilterValue(v) })}>
              <SelectTrigger className="h-10 w-full rounded-lg border-primary/20">
                <SelectValue placeholder="QC status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Any QC</SelectItem>
                {QC_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {QC_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Input
            type="month"
            className="h-10 w-full rounded-lg border-primary/20"
            value={value.month ?? ""}
            onChange={(e) => setMonth(e.target.value || undefined)}
            title="Month range"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">From date</Label>
          <Input
            type="date"
            className="h-10 w-full rounded-lg border-primary/20"
            value={value.fromDate ?? ""}
            onChange={(e) => set({ month: undefined, fromDate: e.target.value || undefined })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">To date</Label>
          <Input
            type="date"
            className="h-10 w-full rounded-lg border-primary/20"
            value={value.toDate ?? ""}
            onChange={(e) => set({ month: undefined, toDate: e.target.value || undefined })}
          />
        </div>
      </div>
    </div>
  );
}
