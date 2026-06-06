"use client";

import { MasterDataTab } from "@/components/masters/master-data-tab";
import { TenantsTab } from "@/components/masters/tenants-tab";
import { TableSkeleton } from "@/components/shared/loading";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTenantAdmin } from "@/hooks/tenants/useTenants";
import { useClientMounted } from "@/hooks/use-client-mounted";
import { MASTER_CATEGORIES } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { Building2, Database, Layers, MapPin } from "lucide-react";
import { useMemo, useState } from "react";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  borderCls,
  iconCls,
  bgCls,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  borderCls: string;
  iconCls: string;
  bgCls: string;
}) {
  return (
    <Card className={cn("border-l-4 transition-shadow hover:shadow-md", borderCls, bgCls)}>
      <CardContent className="flex items-center gap-4 py-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm", iconCls)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          {sub && <p className="mt-0.5 text-[10px] text-muted-foreground/80">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MastersPage() {
  const mounted = useClientMounted();
  const [activeTab, setActiveTab] = useState("masters");
  const tenants = useTenantAdmin();

  const tenantStats = useMemo(() => {
    if (!tenants) return null;
    const ulbCount = tenants.reduce((acc, d) => acc + d.ulbs.length, 0);
    const wardCount = tenants.reduce((acc, d) => acc + d.ulbs.reduce((a, u) => a + u.wards.length, 0), 0);
    return { districts: tenants.length, ulbs: ulbCount, wards: wardCount };
  }, [tenants]);

  return (
    <RoleGate mode="page" capability="masters.manage" deniedDescription="Master data management is admin-only.">
      <div className="space-y-6">
        <PageHeader
          title="Master Data"
          description="Configure dropdown reference values and the geographic tenant hierarchy used across surveys and user assignments."
        />

        {!mounted ? (
          <TableSkeleton rows={8} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {activeTab === "masters" ? (
                <>
                  <StatCard
                    label="Categories"
                    value={MASTER_CATEGORIES.length}
                    sub="Survey dropdown fields"
                    icon={Layers}
                    borderCls="border-l-violet-500"
                    iconCls="bg-violet-500 text-white"
                    bgCls="dark:bg-violet-500/5"
                  />
                  <StatCard
                    label="Reference Data"
                    value="Live"
                    sub="Syncs to open forms"
                    icon={Database}
                    borderCls="border-l-blue-500"
                    iconCls="bg-blue-500 text-white"
                    bgCls="dark:bg-blue-500/5"
                  />
                  <StatCard
                    label="Districts"
                    value={tenantStats?.districts ?? "—"}
                    sub="Geographic hierarchy"
                    icon={MapPin}
                    borderCls="border-l-amber-500"
                    iconCls="bg-amber-500 text-white"
                    bgCls="dark:bg-amber-500/5"
                  />
                  <StatCard
                    label="ULBs"
                    value={tenantStats?.ulbs ?? "—"}
                    sub={`${tenantStats?.wards ?? "—"} wards total`}
                    icon={Building2}
                    borderCls="border-l-emerald-500"
                    iconCls="bg-emerald-500 text-white"
                    bgCls="dark:bg-emerald-500/5"
                  />
                </>
              ) : (
                <>
                  <StatCard
                    label="Districts"
                    value={tenantStats?.districts ?? "—"}
                    icon={MapPin}
                    borderCls="border-l-violet-500"
                    iconCls="bg-violet-500 text-white"
                    bgCls="dark:bg-violet-500/5"
                  />
                  <StatCard
                    label="ULBs"
                    value={tenantStats?.ulbs ?? "—"}
                    sub="Municipal councils & town panchayats"
                    icon={Building2}
                    borderCls="border-l-blue-500"
                    iconCls="bg-blue-500 text-white"
                    bgCls="dark:bg-blue-500/5"
                  />
                  <StatCard
                    label="Wards"
                    value={tenantStats?.wards ?? "—"}
                    sub="Lowest assignment unit"
                    icon={Layers}
                    borderCls="border-l-emerald-500"
                    iconCls="bg-emerald-500 text-white"
                    bgCls="dark:bg-emerald-500/5"
                  />
                  <StatCard
                    label="Categories"
                    value={MASTER_CATEGORIES.length}
                    sub="Reference dropdown fields"
                    icon={Database}
                    borderCls="border-l-amber-500"
                    iconCls="bg-amber-500 text-white"
                    bgCls="dark:bg-amber-500/5"
                  />
                </>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-11 gap-1 rounded-xl p-1">
                <TabsTrigger value="masters" className="gap-2 rounded-lg px-5">
                  <Database className="h-4 w-4" />
                  Reference Data
                </TabsTrigger>
                <TabsTrigger value="tenants" className="gap-2 rounded-lg px-5">
                  <MapPin className="h-4 w-4" />
                  Tenants & Wards
                  {tenantStats && tenantStats.districts > 0 && (
                    <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500 px-1.5 text-[10px] font-bold text-white">
                      {tenantStats.districts}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="masters" className="mt-5">
                <MasterDataTab />
              </TabsContent>

              <TabsContent value="tenants" className="mt-5">
                <TenantsTab />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </RoleGate>
  );
}
