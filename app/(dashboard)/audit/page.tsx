"use client";

import { filterAuditRows } from "@/components/audit/audit-helpers";
import { AuditTable } from "@/components/audit/audit-table";
import { PageHeader } from "@/components/shared/page-header";
import { RoleGate } from "@/components/shared/role-gate";
import { TablePagination } from "@/components/shared/table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuditFacets, useAuditLogPaginated, useAuditSummary } from "@/hooks/audit/useAudit";
import { cn } from "@/lib/utils";
import { Activity, Clock, Filter, Layers, ScrollText, Search, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";

const ALL = "__all__";

function StatCard({
  label,
  value,
  icon: Icon,
  borderCls,
  iconCls,
  bgCls,
}: {
  label: string;
  value: number | string;
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
          <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AuditPage() {
  const [action, setAction] = useState<string | undefined>();
  const [entity, setEntity] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(15);

  const facets = useAuditFacets();
  const summary = useAuditSummary();

  const { rows, isLoading, pageNumber, canGoPrev, canGoNext, goNext, goPrev } = useAuditLogPaginated(
    { action, entity },
    pageSize,
  );

  const filtered = useMemo(() => {
    if (!rows) return undefined;
    return filterAuditRows(rows, search);
  }, [rows, search]);

  const hasFilters = action !== undefined || entity !== undefined || search.trim().length > 0;

  function clearFilters() {
    setAction(undefined);
    setEntity(undefined);
    setSearch("");
  }

  const totalLabel = summary ? (summary.capped ? "1000+" : String(summary.total)) : "—";

  return (
    <RoleGate mode="page" capability="audit.view" deniedDescription="The audit log is restricted to administrators.">
      <div className="space-y-6">
        <PageHeader
          title="Audit Log"
          description="Append-only trail of every mutation across the system — who did what, when, and on which record."
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Recent Entries"
            value={totalLabel}
            icon={ScrollText}
            borderCls="border-l-primary"
            iconCls="bg-primary text-primary-foreground"
            bgCls=""
          />
          <StatCard
            label="Action Types"
            value={summary?.actions ?? "—"}
            icon={Zap}
            borderCls="border-l-violet-500"
            iconCls="bg-violet-500 text-white"
            bgCls="dark:bg-violet-500/5"
          />
          <StatCard
            label="Entity Types"
            value={summary?.entities ?? "—"}
            icon={Layers}
            borderCls="border-l-cyan-500"
            iconCls="bg-cyan-500 text-white"
            bgCls="dark:bg-cyan-500/5"
          />
          <StatCard
            label="Last 24 Hours"
            value={summary?.today ?? "—"}
            icon={Clock}
            borderCls="border-l-emerald-500"
            iconCls="bg-emerald-500 text-white"
            bgCls="dark:bg-emerald-500/5"
          />
        </div>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30 px-5 py-3.5">
            <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-semibold">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                <Filter className="h-3.5 w-3.5 text-primary" />
              </div>
              Filters
              {hasFilters && (
                <Badge variant="secondary" className="ml-1 text-[10px] font-medium">
                  Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search this page — action, actor, entity, or ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select value={action ?? ALL} onValueChange={(v) => setAction(v === ALL ? undefined : v)}>
                  <SelectTrigger className="w-full sm:w-52">
                    <SelectValue placeholder="Filter by action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All actions</SelectItem>
                    {facets?.actions.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={entity ?? ALL} onValueChange={(v) => setEntity(v === ALL ? undefined : v)}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Entity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All entities</SelectItem>
                    {facets?.entities.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0 text-muted-foreground">
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/30 px-5 py-3.5">
            <CardTitle className="flex items-center justify-between gap-3 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-500/20">
                  <Activity className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Activity Feed
              </span>
              <span className="text-xs font-normal tabular-nums text-muted-foreground">
                Page {pageNumber}
                {filtered !== undefined ? ` · ${filtered.length} on this page` : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AuditTable rows={filtered} skeletonRows={pageSize} />
          </CardContent>
          {!isLoading && filtered !== undefined && (
            <div className="border-t border-border px-5 pb-4">
              <TablePagination
                pageNumber={pageNumber}
                pageSize={pageSize}
                itemCount={filtered.length}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                onPrev={goPrev}
                onNext={goNext}
                pageSizeOptions={[10, 15, 25, 50]}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </Card>
      </div>
    </RoleGate>
  );
}
