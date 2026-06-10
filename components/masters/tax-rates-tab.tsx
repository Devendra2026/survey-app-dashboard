"use client";

import { GlassCard, GlassCardHeader } from "@/components/design-system/glass-card";
import { StaggerGrid, StaggerItem } from "@/components/design-system/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useTenantAdmin } from "@/hooks/tenants/useTenants";
import {
  DEFAULT_RATE_MATRIX,
  DEFAULT_ROAD_TYPE_FACTORS,
  DEFAULT_TAX_RATES,
  DEFAULT_USAGE_MULTIPLIERS,
} from "@/lib/qc/tax-rate-defaults";
import { useMutation, useQuery } from "convex/react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  IndianRupee,
  Loader2,
  MapPin,
  Percent,
  RefreshCcw,
  Route,
  Save,
  Settings2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// ─── Dimension constants ──────────────────────────────────────────────────────

const ZONE_ROWS = [
  { key: "below_9m",   label: "0 – 9 m",    hint: "Narrow lane / gali" },
  { key: "9_to_12m",  label: "9 – 12 m",   hint: "Medium road" },
  { key: "12_to_24m", label: "12 – 24 m",  hint: "Main road" },
  { key: "above_24m", label: "> 24 m",      hint: "Highway / arterial" },
];

const CONSTRUCTION_COLS = [
  { key: "pakka_rcc_rb",     label: "RCC / Pakka",   hint: "Pakka with RCC or R.B. roof" },
  { key: "tin_shed",         label: "Other Pakka",   hint: "Tin shed / semi-pakka" },
  { key: "kaccha_building",  label: "Kachcha",        hint: "Kachcha building" },
  { key: "open_land_plot",   label: "Open Land",      hint: "Plot / open land" },
];

const ROAD_TYPE_ROWS = [
  { key: "rcc",    label: "RCC Road",    hint: "Paved / concrete road" },
  { key: "dambar", label: "Dambar Road", hint: "Bitumen / asphalt road" },
  { key: "kaccha", label: "Kachcha Road", hint: "Unpaved / mud road" },
];

const USAGE_ROWS = [
  { key: "residential",              label: "Residential" },
  { key: "commercial",               label: "Commercial" },
  { key: "mix",                      label: "Mix (Residential + Commercial)" },
  { key: "open_land",                label: "Open Land" },
  { key: "open_land_under_construction", label: "Under Construction" },
  { key: "religious_property",       label: "Religious Property" },
  { key: "godown",                   label: "Godown" },
  { key: "agriculture",              label: "Agriculture" },
];

// ─── Form state ───────────────────────────────────────────────────────────────

type MatrixForm = Record<string, Record<string, string>>; // zone → constr → value string

type RateForm = {
  matrix: MatrixForm;
  roadTypeFactors: Record<string, string>;
  propertyTaxPct: string;
  waterTaxPct: string;
  drainageTaxPct: string;
  usageMultipliers: Record<string, string>;
};

function f2(n: number) { return n.toFixed(2); }
function pctToDecimal(s: string) { return parseFloat(s) / 100; }
function pct(v: number) { return `${(v * 100).toFixed(1)}%`; }

function buildDefaultForm(): RateForm {
  const matrix: MatrixForm = {};
  for (const z of ZONE_ROWS) {
    matrix[z.key] = {};
    for (const c of CONSTRUCTION_COLS) {
      matrix[z.key][c.key] = f2(DEFAULT_RATE_MATRIX[z.key]?.[c.key] ?? 4);
    }
  }
  return {
    matrix,
    roadTypeFactors: Object.fromEntries(ROAD_TYPE_ROWS.map((r) => [r.key, f2(DEFAULT_ROAD_TYPE_FACTORS[r.key] ?? 1)])),
    propertyTaxPct: f2((DEFAULT_TAX_RATES.propertyTaxPct) * 100),
    waterTaxPct: f2((DEFAULT_TAX_RATES.waterTaxPct) * 100),
    drainageTaxPct: f2((DEFAULT_TAX_RATES.drainageTaxPct) * 100),
    usageMultipliers: Object.fromEntries(USAGE_ROWS.map((u) => [u.key, f2(DEFAULT_USAGE_MULTIPLIERS[u.key] ?? 1)])),
  };
}

function docToForm(doc: {
  rateMatrix: Record<string, Record<string, number>>;
  roadTypeFactors: Record<string, number>;
  propertyTaxPct: number;
  waterTaxPct: number;
  drainageTaxPct: number;
  usageMultipliers: Record<string, number>;
}): RateForm {
  const matrix: MatrixForm = {};
  for (const z of ZONE_ROWS) {
    matrix[z.key] = {};
    for (const c of CONSTRUCTION_COLS) {
      matrix[z.key][c.key] = f2(doc.rateMatrix[z.key]?.[c.key] ?? DEFAULT_RATE_MATRIX[z.key]?.[c.key] ?? 4);
    }
  }
  return {
    matrix,
    roadTypeFactors: Object.fromEntries(
      ROAD_TYPE_ROWS.map((r) => [r.key, f2(doc.roadTypeFactors[r.key] ?? DEFAULT_ROAD_TYPE_FACTORS[r.key] ?? 1)]),
    ),
    propertyTaxPct: f2(doc.propertyTaxPct * 100),
    waterTaxPct: f2(doc.waterTaxPct * 100),
    drainageTaxPct: f2(doc.drainageTaxPct * 100),
    usageMultipliers: Object.fromEntries(
      USAGE_ROWS.map((u) => [u.key, f2(doc.usageMultipliers[u.key] ?? DEFAULT_USAGE_MULTIPLIERS[u.key] ?? 1)]),
    ),
  };
}

function formToPayload(form: RateForm) {
  const rateMatrix: Record<string, Record<string, number>> = {};
  for (const z of ZONE_ROWS) {
    rateMatrix[z.key] = {};
    for (const c of CONSTRUCTION_COLS) {
      rateMatrix[z.key][c.key] = parseFloat(form.matrix[z.key]?.[c.key] || "0");
    }
  }
  return {
    rateMatrix,
    roadTypeFactors: Object.fromEntries(ROAD_TYPE_ROWS.map((r) => [r.key, parseFloat(form.roadTypeFactors[r.key] || "1")])),
    propertyTaxPct: pctToDecimal(form.propertyTaxPct),
    waterTaxPct: pctToDecimal(form.waterTaxPct),
    drainageTaxPct: pctToDecimal(form.drainageTaxPct),
    usageMultipliers: Object.fromEntries(USAGE_ROWS.map((u) => [u.key, parseFloat(form.usageMultipliers[u.key] || "1")])),
  };
}

// ─── Shared input ─────────────────────────────────────────────────────────────

function RateInput({
  value,
  onChange,
  prefix,
  suffix,
  label,
  step = "0.01",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  label: string;
  step?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {prefix && (
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
          {prefix}
        </span>
      )}
      <Input
        type="number"
        step={step}
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`font-mono tabular-nums text-right text-xs ${prefix ? "pl-5" : ""} ${suffix ? "pr-5" : ""}`}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
          {suffix}
        </span>
      )}
    </div>
  );
}

// ─── ULB Rate Editor ─────────────────────────────────────────────────────────

function UlbRateEditor({ municipalityId }: { municipalityId: Id<"municipalities"> }) {
  const existing = useQuery(api.taxRates.getForMunicipality, { municipalityId });
  const upsert = useMutation(api.taxRates.upsert);
  const reset = useMutation(api.taxRates.resetToDefaults);

  const [form, setForm] = useState<RateForm>(buildDefaultForm());
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existing === undefined) return;
    setForm(existing ? docToForm(existing) : buildDefaultForm());
  }, [existing]);

  function setCell(zone: string, constr: string, val: string) {
    setForm((f) => ({
      ...f,
      matrix: { ...f.matrix, [zone]: { ...f.matrix[zone], [constr]: val } },
    }));
  }

  function setRoadFactor(key: string, val: string) {
    setForm((f) => ({ ...f, roadTypeFactors: { ...f.roadTypeFactors, [key]: val } }));
  }

  function setUsageMult(key: string, val: string) {
    setForm((f) => ({ ...f, usageMultipliers: { ...f.usageMultipliers, [key]: val } }));
  }

  async function handleSave() {
    setError(null);
    setSaving(true);
    try {
      await upsert({ municipalityId, ...formToPayload(form) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setResetting(true);
    try {
      await reset({ municipalityId });
      setForm(buildDefaultForm());
    } finally {
      setResetting(false);
    }
  }

  if (existing === undefined) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
        Loading rates…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {existing ? (
            <Badge variant="default" className="gap-1.5 bg-emerald-600 text-white">
              <CheckCircle2 className="h-3 w-3" aria-hidden /> Custom Rates Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5">
              <Settings2 className="h-3 w-3" aria-hidden /> Using System Defaults
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {existing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={resetting}
              className="cursor-pointer gap-1.5 text-muted-foreground hover:text-destructive"
            >
              {resetting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
              )}
              Reset to Defaults
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="cursor-pointer gap-1.5 bg-brand-navy text-white hover:bg-brand-navy/90 dark:bg-primary dark:hover:bg-primary/90"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : saved ? (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Save className="h-3.5 w-3.5" aria-hidden />
            )}
            {saved ? "Saved!" : "Save Rates"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          {error}
        </div>
      )}

      <StaggerGrid className="grid gap-5">

        {/* ── 1. ALV Rate Matrix ─────────────────────────────── */}
        <StaggerItem>
          <GlassCard padding="md">
            <GlassCardHeader
              title="ALV Rate Matrix — Road Width × Construction Type"
              description="Annual Letting Value per sq ft (₹/sqft/year). Source: UP Nagar Palika Niyamavali 2024."
              icon={<IndianRupee className="h-4 w-4" aria-hidden />}
            />

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-brand-navy/10 bg-brand-navy/5">
                    <th className="py-2.5 pl-3 pr-4 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Road Width Zone
                    </th>
                    {CONSTRUCTION_COLS.map((c) => (
                      <th
                        key={c.key}
                        className="px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                      >
                        <div>{c.label}</div>
                        <div className="mt-0.5 text-[9px] font-normal normal-case text-muted-foreground/70">{c.hint}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ZONE_ROWS.map((zone, zi) => (
                    <tr
                      key={zone.key}
                      className={`border-b border-border/40 ${zi % 2 === 0 ? "" : "bg-muted/20"}`}
                    >
                      <td className="py-3 pl-3 pr-4">
                        <p className="font-semibold text-foreground">{zone.label}</p>
                        <p className="text-xs text-muted-foreground">{zone.hint}</p>
                      </td>
                      {CONSTRUCTION_COLS.map((col) => (
                        <td key={col.key} className="px-2 py-2">
                          <RateInput
                            value={form.matrix[zone.key]?.[col.key] ?? ""}
                            onChange={(v) => setCell(zone.key, col.key, v)}
                            prefix="₹"
                            label={`Rate ${zone.label} × ${col.label}`}
                            className="w-24 mx-auto"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              Monthly rate from circular × 12 = annual value stored here. E.g. 0.51/month → ₹6.12/sqft/year.
            </p>
          </GlassCard>
        </StaggerItem>

        <div className="grid gap-5 lg:grid-cols-3">

          {/* ── 2. Road Type Factors ──────────────────────────── */}
          <StaggerItem>
            <GlassCard padding="md" className="h-full">
              <GlassCardHeader
                title="Road Type Factors"
                description="Multiplier applied based on road surface type"
                icon={<Route className="h-4 w-4" aria-hidden />}
              />
              <div className="space-y-4">
                {ROAD_TYPE_ROWS.map(({ key, label, hint }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <Label htmlFor={`road-${key}`} className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{hint}</p>
                    </Label>
                    <RateInput
                      value={form.roadTypeFactors[key] ?? ""}
                      onChange={(v) => setRoadFactor(key, v)}
                      label={`Road factor ${label}`}
                      step="0.05"
                      className="w-20"
                    />
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">
                  1.00 = no change · 0.90 = 10% lower ALV
                </p>
              </div>
            </GlassCard>
          </StaggerItem>

          {/* ── 3. Tax Percentages ────────────────────────────── */}
          <StaggerItem>
            <GlassCard padding="md" className="h-full">
              <GlassCardHeader
                title="Tax Percentages"
                description="Applied to total ALV for each tax head"
                icon={<Percent className="h-4 w-4" aria-hidden />}
              />
              <div className="space-y-4">
                {[
                  { label: "Property Tax", key: "propertyTaxPct", color: "text-brand-navy dark:text-primary" },
                  { label: "Water Tax", key: "waterTaxPct", color: "text-sky-600 dark:text-sky-400" },
                  { label: "Drainage / Sewer", key: "drainageTaxPct", color: "text-emerald-600 dark:text-emerald-400" },
                ].map(({ label, key, color }) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <Label htmlFor={key} className="flex-1">
                      <p className={`text-sm font-semibold ${color}`}>{label}</p>
                      <p className="text-xs text-muted-foreground">% of ALV</p>
                    </Label>
                    <RateInput
                      value={form[key as keyof RateForm] as string}
                      onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                      suffix="%"
                      label={label}
                      step="0.1"
                      className="w-20"
                    />
                  </div>
                ))}
                <Separator />
                <div className="rounded-xl bg-muted/40 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total</p>
                  <p className="font-mono text-lg font-bold tabular-nums text-foreground">
                    {pct(
                      pctToDecimal(form.propertyTaxPct) +
                      pctToDecimal(form.waterTaxPct) +
                      pctToDecimal(form.drainageTaxPct),
                    )}
                  </p>
                </div>
              </div>
            </GlassCard>
          </StaggerItem>

          {/* ── 4. Usage Multipliers ──────────────────────────── */}
          <StaggerItem>
            <GlassCard padding="md" className="h-full">
              <GlassCardHeader
                title="Usage Multipliers"
                description="Scales ALV by how the property is used"
                icon={<Building2 className="h-4 w-4" aria-hidden />}
              />
              <div className="space-y-3">
                {USAGE_ROWS.map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <Label htmlFor={`usage-${key}`} className="flex-1 text-sm font-medium text-foreground">
                      {label}
                    </Label>
                    <RateInput
                      value={form.usageMultipliers[key] ?? ""}
                      onChange={(v) => setUsageMult(key, v)}
                      label={`Usage multiplier ${label}`}
                      step="0.05"
                      className="w-20"
                    />
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">1.00 = base · 1.45 = 45% premium</p>
              </div>
            </GlassCard>
          </StaggerItem>
        </div>

        {/* ── Formula reference ─────────────────────────────────── */}
        <StaggerItem>
          <div className="rounded-xl border border-border/50 bg-muted/30 px-5 py-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Calculation Formula
            </p>
            <code className="block text-xs leading-relaxed text-foreground">
              ALV = Area × RateMatrix[RoadWidth][Construction] × RoadTypeFactor × UsageMult
              <br />
              Tax = ALV × PropertyTax% + ALV × WaterTax% + ALV × DrainageTax%
            </code>
          </div>
        </StaggerItem>

      </StaggerGrid>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function TaxRatesTab() {
  const tenants = useTenantAdmin();
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>("");
  const [selectedMuniId, setSelectedMuniId] = useState<string>("");

  const allRates = useQuery(api.taxRates.listAll);

  const rateStatusByMuni = useMemo(() => {
    if (!allRates) return new Map<string, boolean>();
    return new Map(allRates.map((r) => [r.municipality._id, r.rates !== null]));
  }, [allRates]);

  const selectedDistrict = tenants?.find((d) => d._id === selectedDistrictId);
  const ulbs = selectedDistrict?.ulbs ?? [];

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
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
        <IndianRupee className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold text-amber-800 dark:text-amber-300">Per-ULB Dynamic Pricing</p>
          <p className="text-amber-700/80 dark:text-amber-400/80">
            Each ULB sets its own rate matrix (road width × construction type), road surface factors,
            usage multipliers, and tax percentages. System defaults apply until overridden.
          </p>
        </div>
      </div>

      {/* ULB selector */}
      <GlassCard padding="md">
        <GlassCardHeader
          title="Select ULB to Configure"
          icon={<MapPin className="h-4 w-4" aria-hidden />}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="district-select" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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
            <Label htmlFor="ulb-select" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Municipality (ULB)
            </Label>
            <Select value={selectedMuniId} onValueChange={setSelectedMuniId} disabled={ulbs.length === 0}>
              <SelectTrigger id="ulb-select" className="cursor-pointer">
                <SelectValue placeholder="Select ULB…" />
              </SelectTrigger>
              <SelectContent>
                {ulbs.map((u) => (
                  <SelectItem key={u._id} value={u._id} className="cursor-pointer">
                    <span className="flex items-center gap-2">
                      {u.name}
                      {rateStatusByMuni.get(u._id) ? (
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Custom
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          Default
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Editor */}
      {selectedMuniId ? (
        <UlbRateEditor key={selectedMuniId} municipalityId={selectedMuniId as Id<"municipalities">} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
          <MapPin className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm">Select a ULB above to configure its tax rates</p>
        </div>
      )}
    </div>
  );
}
