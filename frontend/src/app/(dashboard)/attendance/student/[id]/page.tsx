"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { useParams, useRouter } from "next/navigation";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";

interface StudentAttendanceSummary {
  present: number;
  absent: number;
  total_marked: number;
  attendance_percentage: number;
}

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  
  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const studentId = params.id as string;

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    
    try {
      let resolvedStudentId = studentId;

      if (!studentId || studentId === "me") {
         const dashRes = await apiClient.get(`/dashboard/`);
         if (!dashRes.ok) throw new Error("Could not resolve student profile.");
         const dashData = await dashRes.json();
         if (!dashData.student_id) throw new Error("Student profile not found.");
         resolvedStudentId = dashData.student_id;
      }

      const response = await apiClient.get(`/attendance/student/${resolvedStudentId}`);
      if (!response.ok) {
        if (response.status === 403) throw new Error("You are not authorized to view this attendance.");
        if (response.status === 404) throw new Error("Student not found.");
        throw new Error("Failed to fetch attendance summary");
      }
      const data = await response.json();
      setSummary(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (user?.role !== "STUDENT" && user?.role !== "TEACHER" && user?.role !== "SCHOOL_ADMIN" && user?.role !== "SUPER_ADMIN") {
      router.replace("/");
      return;
    }

    let ignore = false;
    const runFetch = async () => {
      if (!ignore) {
        await fetchSummary();
      }
    };
    runFetch();
    
    return () => { ignore = true; };
  }, [user, router, fetchSummary]);

  if (loading) return <Loading />;
  if (error) return <ErrorState title="Unable to load attendance" description={error} onRetry={fetchSummary} />;
  if (!summary) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Attendance Summary</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)] uppercase tracking-wide">
            Your full attendance record
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">ATTENDANCE</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{summary.attendance_percentage.toFixed(1)}%</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">PRESENT</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{summary.present}</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">ABSENT</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{summary.absent}</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">TOTAL DAYS</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{summary.total_marked}</p>
        </div>
      </div>

      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 mt-8 text-center">
        <p className="text-[var(--muted-foreground)] text-sm">
          Note: Detailed day-by-day history is not available in the current system configuration. 
          Please contact your teacher if you need a detailed history report.
        </p>
      </div>
    </div>
  );
}
