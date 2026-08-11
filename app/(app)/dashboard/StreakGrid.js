"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

const WEEKS = 26; // ~6 months of history
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * GitHub-style contribution grid. Renders the last WEEKS weeks as columns of
 * 7 day-cells; a cell is "active" when its date is in `streakDates`.
 */
export default function StreakGrid({ streakDates }) {
  const active = useMemo(() => new Set(streakDates || []), [streakDates]);

  const columns = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // start on the Sunday of the week WEEKS-1 weeks ago
    const start = new Date(today.getTime() - (WEEKS - 1) * 7 * DAY_MS);
    start.setDate(start.getDate() - start.getDay()); // back to Sunday

    const cols = [];
    let cursor = new Date(start);
    for (let w = 0; w < WEEKS; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const iso = cursor.toISOString().slice(0, 10);
        days.push({
          iso,
          future: cursor > today,
          active: active.has(iso),
        });
        cursor = new Date(cursor.getTime() + DAY_MS);
      }
      cols.push(days);
    }
    return cols;
  }, [active]);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.iso}
                title={day.active ? `Belajar pada ${day.iso}` : day.iso}
                className={cn(
                  "h-3 w-3 rounded-sm",
                  day.future
                    ? "bg-transparent"
                    : day.active
                    ? "bg-emerald-500"
                    : "bg-slate-100"
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <span>Sedikit</span>
        <span className="h-3 w-3 rounded-sm bg-slate-100" />
        <span className="h-3 w-3 rounded-sm bg-emerald-300" />
        <span className="h-3 w-3 rounded-sm bg-emerald-500" />
        <span>Banyak</span>
      </div>
    </div>
  );
}
