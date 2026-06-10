"use client";

import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useTenantAdmin } from "@/hooks/tenants/useTenants";
import type { NormalizedTaxRates } from "@/lib/qc/normalize-tax-rates";
import { computeFloorPropertyTax } from "@/lib/qc/property-tax-calc";
import {
  DEFAULT_TAX_RATES,
  DEFAULT_USAGE_MULTIPLIERS,
  monthlyRateToAnnual,
  TAX_RATE_CONSTRUCTION_COLS,
  TAX_RATE_ZONE_ROWS,
} from "@/lib/qc/tax-rate-defaults";
import {
  annualMatrixToMonthlyForm,
  buildDefaultMonthlyMatrix,
  cloneMonthlyMatrix,
  f2,
  hasWardCustomRates,
  matricesEqual,
  monthlyFormToAnnualMatrix,
  type RateMatrixMonthlyForm,
  resolveWardRateMatrix,
} from "@/lib/qc/tax-rate-matrix";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Copy,
  FileText,
  IndianRupee,
  Loader2,
  MapPin,
  Percent,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  Settings2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type WardInfo = { wardNo: string; name: string; wardCode: string };

type RateForm = {
  defaultMatrix: RateMatrixMonthlyForm;
  wardMatrices: Record<string, RateMatrixMonthlyForm>;
  propertyTaxPct: string;
  waterTaxPct: string;
  drainageTaxPct: string;
  usageMultipliers: Record<string, string>;
};

const USAGE_ROWS = [
  { key: "residential", label: "Residential" },
  { key: "commercial", label: "Commercial" },
  { key: "mix", label: "Mixed Use" },
  { key: "open_land", label: "Open Land" },
  { key: "open_land_under_construction", label: "Under Construction" },
  { key: "religious_property", label: "Religious" },
  { key: "godown", label: "Godown" },
  { key: "agriculture", label: "Agriculture" },
];

function pctToDecimal(s: string) {
  return parseFloat(s) / 100;
}
function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

function buildWardForm(wards: WardInfo[], existing: NormalizedTaxRates | null): RateForm {
  const defaultMatrix = existing ? annualMatrixToMonthlyForm(existing.rateMatrix) : buildDefaultMonthlyMatrix();

  const wardMatrices: Record<string, RateMatrixMonthlyForm> = {};
  for (const ward of wards) {
    const annual = resolveWardRateMatrix(ward.wardNo, existing?.wardRates, existing?.rateMatrix ?? null);
    wardMatrices[ward.wardNo] = annualMatrixToMonthlyForm(annual);
  }

  return {
    defaultMatrix,
    wardMatrices,
    propertyTaxPct: f2((existing?.propertyTaxPct ?? DEFAULT_TAX_RATES.propertyTaxPct) * 100),
    waterTaxPct: f2((existing?.waterTaxPct ?? DEFAULT_TAX_RATES.waterTaxPct) * 100),
    drainageTaxPct: f2((existing?.drainageTaxPct ?? DEFAULT_TAX_RATES.drainageTaxPct) * 100),
    usageMultipliers: Object.fromEntries(
      USAGE_ROWS.map((u) => [u.key, f2(existing?.usageMultipliers?.[u.key] ?? DEFAULT_USAGE_MULTIPLIERS[u.key] ?? 1)]),
    ),
  };
}

function ulbSettingsFromForm(form: RateForm) {
  return {
    propertyTaxPct: pctToDecimal(form.propertyTaxPct),
    waterTaxPct: pctToDecimal(form.waterTaxPct),
    drainageTaxPct: pctToDecimal(form.drainageTaxPct),
    usageMultipliers: Object.fromEntries(
      USAGE_ROWS.map((u) => [u.key, parseFloat(form.usageMultipliers[u.key] || "1")]),
    ),
  };
}

function formToPayload(form: RateForm, wards: WardInfo[]) {
  const wardRates: Record<string, ReturnType<typeof monthlyFormToAnnualMatrix>> = {};
  for (const ward of wards) {
    const matrix = form.wardMatrices[ward.wardNo];
    if (matrix) wardRates[ward.wardNo] = monthlyFormToAnnualMatrix(matrix);
  }
  return {
    rateMatrix: monthlyFormToAnnualMatrix(form.defaultMatrix),
    wardRates,
    ...ulbSettingsFromForm(form),
  };
}

function WardRatePreview({
  wardNo,
  matrix,
  propertyTaxPct,
  previewZoneKey,
  previewConstrKey,
  onZoneChange,
  onConstrChange,
}: {
  wardNo: string;
  matrix: RateMatrixMonthlyForm;
  propertyTaxPct: number;
  previewZoneKey: string;
  previewConstrKey: string;
  onZoneChange: (key: string) => void;
  onConstrChange: (key: string) => void;
}) {
  const zone = TAX_RATE_ZONE_ROWS.find((z) => z.key === previewZoneKey) ?? TAX_RATE_ZONE_ROWS[0];
  const construction =
    TAX_RATE_CONSTRUCTION_COLS.find((c) => c.key === previewConstrKey) ?? TAX_RATE_CONSTRUCTION_COLS[0];
  const monthly = parseFloat(matrix[zone.key]?.[construction.key] || "0");
  const annual = monthlyRateToAnnual(monthly);
  const exampleArea = 594;
  const { alv, assessableAlv, tax } = computeFloorPropertyTax(exampleArea, annual, propertyTaxPct);

  return (
    <div className="space-y-3 border-b border-border/50 bg-emerald-50/50 px-5 py-4 dark:bg-emerald-950/15">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Road width</Label>
          <Select value={previewZoneKey} onValueChange={onZoneChange}>
            <SelectTrigger className="h-8 w-44 cursor-pointer text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_RATE_ZONE_ROWS.map((z) => (
                <SelectItem key={z.key} value={z.key} className="cursor-pointer text-xs">
                  {z.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Construction</Label>
          <Select value={previewConstrKey} onValueChange={onConstrChange}>
            <SelectTrigger className="h-8 w-44 cursor-pointer text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_RATE_CONSTRUCTION_COLS.map((c) => (
                <SelectItem key={c.key} value={c.key} className="cursor-pointer text-xs">
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">Ward {wardNo} preview · matches demand notice lookup</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border/40 bg-card/80 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Selected zone</p>
          <p className="mt-1 text-sm font-semibold text-foreground">{zone.label}</p>
          <p className="text-[10px] text-muted-foreground">{construction.label}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-card/80 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly rate</p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums">₹{f2(monthly)}/sqft</p>
          <p className="text-[10px] text-muted-foreground">Annual ₹{f2(annual)}/sqft</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-card/80 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Gross ALV @ {exampleArea} sqft
          </p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums">
            ₹{alv.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Taxable 80%: ₹{assessableAlv.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-lg border border-border/40 bg-card/80 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Property tax ({pct(propertyTaxPct)})
          </p>
          <p className="mt-1 font-mono text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            ₹{tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}

function RateInput({
  value,
  onChange,
  label,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">
        ₹
      </span>
      <Input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-9 pl-6 font-mono text-xs tabular-nums text-right"
      />
    </div>
  );
}

function UlbRateEditor({
  municipalityId,
  municipalityName,
  districtName,
  wards,
}: {
  municipalityId: Id<"municipalities">;
  municipalityName: string;
  districtName: string;
  wards: WardInfo[];
}) {
  const existing = useQuery(api.taxRates.getForMunicipality, { municipalityId });
  const upsert = useMutation(api.taxRates.upsert);
  const saveWard = useMutation(api.taxRates.saveWard);
  const reset = useMutation(api.taxRates.resetToDefaults);

  const [selectedWardNo, setSelectedWardNo] = useState(wards[0]?.wardNo ?? "");
  const [wardSearch, setWardSearch] = useState("");
  const [form, setForm] = useState<RateForm | null>(null);
  const baselineRef = useRef<RateForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingWard, setSavingWard] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [wardSaved, setWardSaved] = useState(false);
  const [previewZoneKey, setPreviewZoneKey] = useState("below_9m");
  const [previewConstrKey, setPreviewConstrKey] = useState("pakka_rcc_rb");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing === undefined || wards.length === 0) return;
    const built = buildWardForm(wards, existing);
    setForm(built);
    baselineRef.current = {
      ...built,
      wardMatrices: Object.fromEntries(
        Object.entries(built.wardMatrices).map(([key, matrix]) => [key, cloneMonthlyMatrix(matrix)]),
      ),
      usageMultipliers: { ...built.usageMultipliers },
    };
  }, [existing, wards, municipalityId]);

  useEffect(() => {
    if (wards.length > 0 && !wards.some((w) => w.wardNo === selectedWardNo)) {
      setSelectedWardNo(wards[0]?.wardNo ?? "");
    }
  }, [wards, selectedWardNo]);

  const filteredWards = useMemo(() => {
    const q = wardSearch.trim().toLowerCase();
    if (!q) return wards;
    return wards.filter(
      (w) =>
        w.wardNo.toLowerCase().includes(q) || w.name.toLowerCase().includes(q) || w.wardCode.toLowerCase().includes(q),
    );
  }, [wards, wardSearch]);

  const selectedWard = wards.find((w) => w.wardNo === selectedWardNo);
  const wardMatrix = form?.wardMatrices[selectedWardNo];

  const configuredCount = useMemo(() => {
    if (!existing) return 0;
    return wards.filter((w) => hasWardCustomRates(w.wardNo, existing.wardRates)).length;
  }, [existing, wards]);

  const dirtyWardNos = useMemo(() => {
    if (!form || !baselineRef.current) return new Set<string>();
    const dirty = new Set<string>();
    for (const ward of wards) {
      const current = form.wardMatrices[ward.wardNo];
      const base = baselineRef.current.wardMatrices[ward.wardNo];
      if (current && base && !matricesEqual(current, base)) dirty.add(ward.wardNo);
    }
    return dirty;
  }, [form, wards]);

  const selectedWardDirty = dirtyWardNos.has(selectedWardNo);

  const ulbSettingsDirty = useMemo(() => {
    if (!form || !baselineRef.current) return false;
    const base = baselineRef.current;
    return (
      form.propertyTaxPct !== base.propertyTaxPct ||
      form.waterTaxPct !== base.waterTaxPct ||
      form.drainageTaxPct !== base.drainageTaxPct ||
      USAGE_ROWS.some((u) => form.usageMultipliers[u.key] !== base.usageMultipliers[u.key])
    );
  }, [form]);

  function setCell(zone: string, constr: string, val: string) {
    if (!form || !selectedWardNo) return;
    setForm((f) => {
      if (!f) return f;
      const current = f.wardMatrices[selectedWardNo] ?? buildDefaultMonthlyMatrix();
      return {
        ...f,
        wardMatrices: {
          ...f.wardMatrices,
          [selectedWardNo]: {
            ...current,
            [zone]: { ...current[zone], [constr]: val },
          },
        },
      };
    });
  }

  function setUsageMult(key: string, val: string) {
    setForm((f) => (f ? { ...f, usageMultipliers: { ...f.usageMultipliers, [key]: val } } : f));
  }

  function applyDefaultToWard() {
    if (!form || !selectedWardNo) return;
    setForm((f) =>
      f
        ? {
            ...f,
            wardMatrices: {
              ...f.wardMatrices,
              [selectedWardNo]: cloneMonthlyMatrix(f.defaultMatrix),
            },
          }
        : f,
    );
  }

  function copyWardToAll() {
    if (!form || !selectedWardNo) return;
    const source = form.wardMatrices[selectedWardNo];
    if (!source) return;
    setForm((f) => {
      if (!f) return f;
      const wardMatrices = { ...f.wardMatrices };
      for (const w of wards) {
        wardMatrices[w.wardNo] = cloneMonthlyMatrix(source);
      }
      return { ...f, wardMatrices };
    });
  }

  function resetWardToSystemDefault() {
    if (!form || !selectedWardNo) return;
    setForm((f) =>
      f
        ? {
            ...f,
            wardMatrices: {
              ...f.wardMatrices,
              [selectedWardNo]: buildDefaultMonthlyMatrix(),
            },
          }
        : f,
    );
  }

  async function handleSaveWard() {
    if (!form || !selectedWardNo) return;
    const matrix = form.wardMatrices[selectedWardNo];
    if (!matrix) return;
    setError(null);
    setSavingWard(true);
    try {
      await saveWard({
        municipalityId,
        wardNo: selectedWardNo,
        wardRateMatrix: monthlyFormToAnnualMatrix(matrix),
        ...ulbSettingsFromForm(form),
      });
      setWardSaved(true);
      setTimeout(() => setWardSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingWard(false);
    }
  }

  async function handleSave() {
    if (!form) return;
    setError(null);
    setSaving(true);
    try {
      await upsert({ municipalityId, ...formToPayload(form, wards) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetAll() {
    setResetting(true);
    try {
      await reset({ municipalityId });
      setForm(buildWardForm(wards, null));
    } finally {
      setResetting(false);
    }
  }

  if (existing === undefined || !form) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
        Loading rate schedule…
      </div>
    );
  }

  if (wards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-muted-foreground">
        <MapPin className="mx-auto mb-3 h-8 w-8 opacity-30" aria-hidden />
        <p className="font-medium text-foreground">No wards configured</p>
        <p className="mt-1 text-sm">Add wards under Tenants &amp; Wards before setting tax rates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-premium-sm">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Minimum Monthly Rental Rates
          </p>
          <h3 className="font-display text-xl font-bold tracking-tight text-foreground">{municipalityName}</h3>
          <p className="text-sm text-muted-foreground">
            {districtName} · {wards.length} wards · {configuredCount} with published ward rates
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {existing ? (
            <Badge className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600">
              <CheckCircle2 className="h-3 w-3" aria-hidden /> Published
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5">
              <Settings2 className="h-3 w-3" aria-hidden /> System Defaults
            </Badge>
          )}
          {existing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetAll}
              disabled={resetting}
              className="cursor-pointer gap-1.5 text-muted-foreground hover:text-destructive"
            >
              {resetting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
              )}
              Reset ULB
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="cursor-pointer gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : saved ? (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden />
            )}
            {saved ? "Saved" : "Save All Wards"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        {/* Ward rail */}
        <GlassCard padding="none" className="overflow-hidden xl:max-h-[calc(100vh-14rem)]">
          <div className="border-b border-border/60 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Wards</p>
            <div className="relative mt-2">
              <Search
                className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={wardSearch}
                onChange={(e) => setWardSearch(e.target.value)}
                placeholder="Search ward…"
                className="h-8 pl-8 text-xs"
                aria-label="Search wards"
              />
            </div>
          </div>
          <ScrollArea className="h-[min(420px,50vh)] xl:h-[calc(100vh-18rem)]">
            <ul className="p-2">
              {filteredWards.map((ward) => {
                const active = ward.wardNo === selectedWardNo;
                const hasCustom = hasWardCustomRates(ward.wardNo, existing?.wardRates);
                const isDirty = dirtyWardNos.has(ward.wardNo);
                return (
                  <li key={ward.wardNo}>
                    <button
                      type="button"
                      onClick={() => setSelectedWardNo(ward.wardNo)}
                      className={cn(
                        "mb-1 w-full cursor-pointer rounded-xl px-3 py-2.5 text-left transition-colors",
                        active ? "bg-emerald-600 text-white shadow-sm" : "hover:bg-muted/60",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "font-mono text-xs font-bold tabular-nums",
                            active ? "text-white/90" : "text-primary",
                          )}
                        >
                          Ward {ward.wardNo}
                        </span>
                        <span className="flex items-center gap-1">
                          {isDirty && (
                            <span
                              className={cn("h-2 w-2 rounded-full", active ? "bg-amber-200" : "bg-amber-500")}
                              title="Unsaved changes"
                            />
                          )}
                          {hasCustom && (
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                                active
                                  ? "bg-white/20 text-white"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
                              )}
                            >
                              Saved
                            </span>
                          )}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "mt-0.5 truncate text-xs font-medium",
                          active ? "text-white/95" : "text-foreground",
                        )}
                      >
                        {ward.name}
                      </p>
                      <p className={cn("truncate text-[10px]", active ? "text-white/70" : "text-muted-foreground")}>
                        {ward.wardCode}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        </GlassCard>

        {/* Ward editor */}
        <div className="space-y-5">
          {selectedWard && wardMatrix && (
            <GlassCard padding="none" className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-5 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Editing</p>
                  <h4 className="font-display text-lg font-bold text-foreground">
                    Ward {selectedWard.wardNo} — {selectedWard.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">{selectedWard.wardCode}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={applyDefaultToWard}
                    className="cursor-pointer gap-1.5 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden /> ULB Default
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetWardToSystemDefault}
                    className="cursor-pointer gap-1.5 text-xs"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" aria-hidden /> System Default
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyWardToAll}
                    className="cursor-pointer gap-1.5 text-xs"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden /> Copy to All Wards
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveWard}
                    disabled={savingWard || (!selectedWardDirty && !ulbSettingsDirty)}
                    className="cursor-pointer gap-1.5 bg-emerald-700 text-white hover:bg-emerald-800"
                  >
                    {savingWard ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : wardSaved ? (
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Save className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {wardSaved ? "Ward Saved" : `Save Ward ${selectedWard.wardNo}`}
                  </Button>
                </div>
              </div>

              <WardRatePreview
                wardNo={selectedWard.wardNo}
                matrix={wardMatrix}
                propertyTaxPct={pctToDecimal(form.propertyTaxPct)}
                previewZoneKey={previewZoneKey}
                previewConstrKey={previewConstrKey}
                onZoneChange={setPreviewZoneKey}
                onConstrChange={setPreviewConstrKey}
              />

              <div className="overflow-x-auto">
                <table className="w-full min-w-160 border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-brand-navy/15 bg-brand-navy text-white">
                      <th className="sticky left-0 z-10 min-w-50 border-r border-white/10 bg-brand-navy px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide">
                        Road Width
                      </th>
                      {TAX_RATE_CONSTRUCTION_COLS.map((col) => (
                        <th key={col.key} className="min-w-28 border-l border-white/10 px-2 py-3 text-center">
                          <p className="text-[10px] font-bold">{col.label}</p>
                          <p className="mt-0.5 text-[9px] font-normal text-white/70">{col.hint}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TAX_RATE_ZONE_ROWS.map((zone, rowIdx) => (
                      <tr
                        key={zone.key}
                        className={cn("border-b border-border/40", rowIdx % 2 === 0 ? "bg-background" : "bg-muted/10")}
                      >
                        <td className="sticky left-0 z-10 border-r border-border/50 bg-inherit px-4 py-3">
                          <p className="text-sm font-semibold text-foreground">{zone.label}</p>
                          <p className="text-[10px] text-muted-foreground">{zone.hint}</p>
                        </td>
                        {TAX_RATE_CONSTRUCTION_COLS.map((col) => (
                          <td key={col.key} className="border-l border-border/30 px-2 py-2.5">
                            <RateInput
                              value={wardMatrix[zone.key]?.[col.key] ?? ""}
                              onChange={(v) => setCell(zone.key, col.key, v)}
                              label={`Ward ${selectedWard.wardNo} ${zone.label} ${col.label}`}
                              className="mx-auto w-19"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-start gap-2 border-t border-border/50 bg-muted/15 px-5 py-3">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Monthly rate (₹/sqft/month) stored in master; demand notice uses yearly rate (×12). Gross ALV = area ×
                  yearly rate · Yearly assessable = gross ALV × 80% · Yearly assessable tax = yearly assessable ÷ 100 ×
                  12.5 · Water = yearly assessable ÷ 100 × 7 · Drainage = yearly assessable ÷ 100 × 2.5 · Total demand
                  (yearly) = Yearly assessable + Water + Drainage = Total demand (yearly).
                </p>
              </div>
            </GlassCard>
          )}

          {/* ULB-wide settings */}
          <div className="grid gap-5 lg:grid-cols-2">
            <GlassCard padding="md">
              <GlassCardHeader
                title="Tax Percentages"
                description="Applied to total ALV"
                icon={<Percent className="h-4 w-4" aria-hidden />}
              />
              <div className="space-y-3">
                {[
                  { label: "Property Tax", key: "propertyTaxPct" },
                  { label: "Water Tax", key: "waterTaxPct" },
                  { label: "Drainage / Sewer", key: "drainageTaxPct" },
                ].map(({ label, key }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <Label className="text-sm font-medium">{label}</Label>
                    <div className="relative w-20">
                      <Input
                        type="number"
                        step="0.1"
                        value={form[key as keyof RateForm] as string}
                        onChange={(e) => setForm((f) => (f ? { ...f, [key]: e.target.value } : f))}
                        className="pr-6 text-right font-mono text-xs tabular-nums"
                        aria-label={label}
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="rounded-lg bg-muted/40 px-3 py-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Combined</p>
                  <p className="font-mono text-lg font-bold tabular-nums">
                    {pct(
                      pctToDecimal(form.propertyTaxPct) +
                        pctToDecimal(form.waterTaxPct) +
                        pctToDecimal(form.drainageTaxPct),
                    )}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard padding="md">
              <GlassCardHeader
                title="Usage Multipliers"
                description="Scales ALV by property use"
                icon={<Building2 className="h-4 w-4" aria-hidden />}
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {USAGE_ROWS.map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/10 px-3 py-2"
                  >
                    <span className="truncate text-xs font-medium">{label}</span>
                    <Input
                      type="number"
                      step="0.05"
                      value={form.usageMultipliers[key] ?? ""}
                      onChange={(e) => setUsageMult(key, e.target.value)}
                      className="h-8 w-16 text-right font-mono text-xs tabular-nums"
                      aria-label={`${label} multiplier`}
                    />
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TaxRatesTab() {
  const tenants = useTenantAdmin();
  const [selectedDistrictId, setSelectedDistrictId] = useState("");
  const [selectedMuniId, setSelectedMuniId] = useState("");

  const allRates = useQuery(api.taxRates.listAll);

  const rateStatusByMuni = useMemo(() => {
    if (!allRates) return new Map<string, { published: boolean; wardCount: number }>();
    return new Map(
      allRates.map((r) => [
        r.municipality._id,
        {
          published: r.rates !== null,
          wardCount: r.rates ? Object.keys(r.rates.wardRates).length : 0,
        },
      ]),
    );
  }, [allRates]);

  const selectedDistrict = tenants?.find((d) => d._id === selectedDistrictId);
  const ulbs = selectedDistrict?.ulbs ?? [];
  const selectedUlb = ulbs.find((u) => u._id === selectedMuniId);
  const wards: WardInfo[] = useMemo(
    () =>
      (selectedUlb?.wards ?? []).map((w) => ({
        wardNo: w.wardNo,
        name: w.name,
        wardCode: w.wardCode,
      })),
    [selectedUlb],
  );

  useEffect(() => {
    if (tenants && tenants.length > 0 && !selectedDistrictId) {
      setSelectedDistrictId(tenants[0]._id);
      if (tenants[0].ulbs.length > 0) setSelectedMuniId(tenants[0].ulbs[0]._id);
    }
  }, [tenants, selectedDistrictId]);

  function handleDistrictChange(id: string) {
    setSelectedDistrictId(id);
    const d = tenants?.find((t) => t._id === id);
    setSelectedMuniId(d?.ulbs[0]?._id ?? "");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-linear-to-r from-emerald-50/80 to-background px-4 py-3 dark:border-emerald-800/40 dark:from-emerald-950/20">
        <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold text-foreground">Ward-wise Minimum Rental Rate Schedule</p>
          <p className="text-muted-foreground">
            Configure monthly rates per ward, road width, and construction type. Demand notices pick the matrix for the
            survey&apos;s ward automatically.
          </p>
        </div>
      </div>

      <GlassCard padding="md">
        <GlassCardHeader title="Select Municipality" icon={<MapPin className="h-4 w-4" aria-hidden />} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="district-select"
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              District
            </Label>
            <Select value={selectedDistrictId} onValueChange={handleDistrictChange}>
              <SelectTrigger id="district-select" className="cursor-pointer">
                <SelectValue placeholder="Select district…" />
              </SelectTrigger>
              <SelectContent>
                {tenants?.map((d) => (
                  <SelectItem key={d._id} value={d._id} className="cursor-pointer">
                    {d.name}
                    <span className="ml-2 text-xs text-muted-foreground">{d.ulbs.length} ULBs</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label
              htmlFor="ulb-select"
              className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Municipality
            </Label>
            <Select value={selectedMuniId} onValueChange={setSelectedMuniId} disabled={ulbs.length === 0}>
              <SelectTrigger id="ulb-select" className="cursor-pointer">
                <SelectValue placeholder="Select ULB…" />
              </SelectTrigger>
              <SelectContent>
                {ulbs.map((u) => {
                  const status = rateStatusByMuni.get(u._id);
                  return (
                    <SelectItem key={u._id} value={u._id} className="cursor-pointer">
                      <span className="flex items-center gap-2">
                        {u.name}
                        <span className="text-xs text-muted-foreground">{u.wards.length} wards</span>
                        {status?.published && (
                          <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {status.wardCount > 0 ? `${status.wardCount} set` : "Published"}
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {selectedMuniId && selectedDistrict && selectedUlb ? (
        <UlbRateEditor
          key={selectedMuniId}
          municipalityId={selectedMuniId as Id<"municipalities">}
          municipalityName={selectedUlb.name}
          districtName={selectedDistrict.name}
          wards={wards}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
          <MapPin className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm">Select a district and municipality to configure ward tax rates</p>
        </div>
      )}
    </div>
  );
}
