"use client";

import { GlassCard } from "@/components/design-system/glass-card";
import { cn } from "@/lib/utils";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type CalendarSurvey = {
  _id: string;
  propertyId?: string;
  parcelNo?: string;
  _creationTime: number;
  status: string;
  qcStatus: string;
};

const statusColors: Record<string, string> = {
  draft: "bg-slate-400",
  submitted: "bg-brand-navy",
  approved: "bg-emerald-500",
  pending: "bg-amber-500",
  rejected: "bg-rose-500",
};

export function SurveyCalendarView({ surveys, className }: { surveys: CalendarSurvey[]; className?: string }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = addDays(startOfWeek(endOfMonth(month)), 6);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarSurvey[]>();
    for (const s of surveys) {
      const key = format(new Date(s._creationTime), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return map;
  }, [surveys]);

  const weeks = useMemo(() => {
    const rows: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [days]);

  return (
    <GlassCard padding="md" className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-sm font-semibold">{format(month, "MMMM yyyy")}</h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border/60 transition-colors hover:bg-muted/50"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMonth(startOfMonth(new Date()))}
            className="cursor-pointer rounded-lg border border-border/60 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted/50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-border/60 transition-colors hover:bg-muted/50"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border/50 bg-border/40 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-muted/30 px-1 py-2">
            {d}
          </div>
        ))}
      </div>

      <table
        className="mt-px w-full table-fixed border-separate border-spacing-px rounded-xl border border-border/50 bg-border/40"
        aria-label="Survey calendar"
      >
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              {week.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const items = byDay.get(key) ?? [];
                const inMonth = isSameMonth(day, month);
                const today = isSameDay(day, new Date());

                return (
                  <td
                    key={key}
                    className={cn(
                      "min-h-18 bg-card/80 p-1.5 align-top sm:min-h-22",
                      !inMonth && "opacity-40",
                      today && "ring-1 ring-inset ring-primary/40",
                    )}
                  >
                    <span className={cn("text-xs font-medium", today && "text-primary")}>{format(day, "d")}</span>
                    <div className="mt-1 space-y-0.5">
                      {items.slice(0, 3).map((s) => {
                        const dot = statusColors[s.qcStatus] ?? statusColors[s.status] ?? "bg-primary";
                        return (
                          <Link
                            key={s._id}
                            href={`/surveys/${s._id}`}
                            className="flex cursor-pointer items-center gap-1 truncate rounded px-0.5 text-[9px] font-medium transition-colors hover:bg-muted/60 sm:text-[10px]"
                            title={s.propertyId || `Parcel ${s.parcelNo}`}
                          >
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot)} aria-hidden />
                            <span className="truncate">{s.propertyId || s.parcelNo}</span>
                          </Link>
                        );
                      })}
                      {items.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">+{items.length - 3}</span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}
