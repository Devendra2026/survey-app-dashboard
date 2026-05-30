"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMasters } from "@/hooks/masters/useMasters";
import { QC_STATUSES, QC_STATUS_LABEL, SURVEY_STATUSES, SURVEY_STATUS_LABEL } from "@/lib/domain";
import { Search } from "lucide-react";

export interface FilterState {
  search: string;
  districtId?: string;
  municipalityId?: string;
  wardNo?: string;
  status?: string;
  qcStatus?: string;
}

const ALL = "__all__";

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
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });
  const pick = (v: string) => (v === ALL ? undefined : v);

  const wardsInScope = (masters?.wards ?? []).filter(
    (w: any) => !value.municipalityId || w.municipalityId === value.municipalityId,
  );
  const ulbsInScope = (masters?.ulbs ?? []).filter((m: any) => !value.districtId || m.districtId === value.districtId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search Property ID, owner, mobile, parcel…"
          className="pl-9"
          value={value.search}
          onChange={(e) => set({ search: e.target.value })}
        />
      </div>

      <Select
        value={value.districtId ?? ALL}
        onValueChange={(v) => set({ districtId: pick(v), municipalityId: undefined, wardNo: undefined })}
      >
        <SelectTrigger className="w-40">
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

      <Select
        value={value.municipalityId ?? ALL}
        onValueChange={(v) => set({ municipalityId: pick(v), wardNo: undefined })}
      >
        <SelectTrigger className="w-40">
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

      <Select value={value.wardNo ?? ALL} onValueChange={(v) => set({ wardNo: pick(v) })}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Ward" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All wards</SelectItem>
          {wardsInScope.map((w: any) => (
            <SelectItem key={w._id} value={w.wardNo}>
              Ward {w.wardNo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showStatus && (
        <Select value={value.status ?? ALL} onValueChange={(v) => set({ status: pick(v) })}>
          <SelectTrigger className="w-36">
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
      )}

      {showQcStatus && (
        <Select value={value.qcStatus ?? ALL} onValueChange={(v) => set({ qcStatus: pick(v) })}>
          <SelectTrigger className="w-36">
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
      )}
    </div>
  );
}
