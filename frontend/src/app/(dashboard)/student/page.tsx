"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";

interface StudentDashboardData {
  attendance_percentage: number;
  present_days: number;
  absent_days: number;
  class_name: string | null;
  class_grade: string | null;
  class_section: string | null;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await apiClient.get("/dashboard/");
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const dashboardData = await res.json();
        setData(dashboardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800/50 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState 
        title="Unable to load dashboard" 
        onRetry={() => window.location.reload()} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Student Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Good morning, {user?.email}. Here is your recent activity.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Attendance</CardTitle>
            <CardDescription>Your overall attendance performance</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-5xl font-bold text-[var(--foreground)] mb-6">
              {(data.present_days + data.absent_days) > 0 ? `${data.attendance_percentage.toFixed(0)}%` : "N/A"}
            </div>
            
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-[var(--muted-foreground)]">Present Days</span>
                <span className="font-medium text-[var(--foreground)]">{data.present_days}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b pb-2">
                <span className="text-[var(--muted-foreground)]">Absent Days</span>
                <span className="font-medium text-[var(--foreground)]">{data.absent_days}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--muted-foreground)]">Total Recorded</span>
                <span className="font-medium text-[var(--foreground)]">{data.present_days + data.absent_days}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {data.class_name && (
          <Card>
            <CardHeader>
              <CardTitle>My Class</CardTitle>
              <CardDescription>Class information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border">
                <div className="text-xl font-semibold mb-2">{data.class_name}</div>
                <div className="text-sm text-[var(--muted-foreground)]">Grade: {data.class_grade}</div>
                <div className="text-sm text-[var(--muted-foreground)]">Section: {data.class_section}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
