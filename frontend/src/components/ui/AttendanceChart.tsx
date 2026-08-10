import React from "react";

interface AttendanceChartProps {
  present: number;
  absent: number;
  notMarked: number;
}

export function AttendanceChart({ present, absent, notMarked }: AttendanceChartProps) {
  const total = present + absent + notMarked;
  
  if (total === 0) {
    return (
      <div className="w-full h-4 bg-[var(--accent)] rounded overflow-hidden">
      </div>
    );
  }

  const presentPercent = (present / total) * 100;
  const absentPercent = (absent / total) * 100;
  const notMarkedPercent = (notMarked / total) * 100;

  return (
    <div className="space-y-4">
      <div className="w-full h-4 bg-[var(--accent)] rounded-full overflow-hidden flex">
        {present > 0 && <div style={{ width: `${presentPercent}%` }} className="bg-[var(--foreground)]" title={`Present: ${present}`} />}
        {absent > 0 && <div style={{ width: `${absentPercent}%` }} className="bg-red-500" title={`Absent: ${absent}`} />}
        {notMarked > 0 && <div style={{ width: `${notMarkedPercent}%` }} className="bg-gray-300 dark:bg-gray-700" title={`Not Marked: ${notMarked}`} />}
      </div>
      
      <div className="flex gap-4 text-sm mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[var(--foreground)]" />
          <span className="font-medium text-[var(--foreground)]">Present</span>
          <span className="text-[var(--muted-foreground)] ml-1">{present}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="font-medium text-[var(--foreground)]">Absent</span>
          <span className="text-[var(--muted-foreground)] ml-1">{absent}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-700" />
          <span className="font-medium text-[var(--foreground)]">Not Marked</span>
          <span className="text-[var(--muted-foreground)] ml-1">{notMarked}</span>
        </div>
      </div>
    </div>
  );
}
