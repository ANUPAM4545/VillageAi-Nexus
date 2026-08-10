"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { AttendanceChart } from "@/components/ui/AttendanceChart";
import Link from "next/link";

interface DashboardData {
  students_total: number;
  teachers_total: number;
  classes_total: number;
  attendance: {
    present: number;
    absent: number;
    not_marked: number;
    percentage: number;
  };
}

export default function SchoolAdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
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
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800/50 rounded-xl"></div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-gray-100 dark:bg-gray-800/50 rounded-xl"></div>
          <div className="h-64 bg-gray-100 dark:bg-gray-800/50 rounded-xl"></div>
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
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Good morning, {user?.email}. Here&apos;s what&apos;s happening at your school today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--foreground)]">{data.students_total}</div>
            <Link href="/students" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-1 inline-block">Total students</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--foreground)]">{data.teachers_total}</div>
            <Link href="/teachers" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-1 inline-block">Total teachers</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--foreground)]">{data.classes_total}</div>
            <Link href="/classes" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-1 inline-block">Total classes</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Attendance %</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[var(--foreground)]">
              {(data.attendance.present + data.attendance.absent) > 0 ? `${data.attendance.percentage.toFixed(1)}%` : "N/A"}
            </div>
            <Link href="/attendance" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-1 inline-block">Today&apos;s attendance</Link>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
            <CardDescription>Today&apos;s school-wide attendance</CardDescription>
          </CardHeader>
          <CardContent>
            {(data.attendance.present + data.attendance.absent + data.attendance.not_marked) === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">No attendance data available.</p>
            ) : (
              <AttendanceChart 
                present={data.attendance.present} 
                absent={data.attendance.absent} 
                notMarked={data.attendance.not_marked} 
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/students/new"><Button variant="secondary" className="w-full justify-start">+ Add Student</Button></Link>
            <Link href="/teachers/new"><Button variant="secondary" className="w-full justify-start">+ Add Teacher</Button></Link>
            <Link href="/classes/new"><Button variant="secondary" className="w-full justify-start">+ Add Class</Button></Link>
            <Link href="/attendance"><Button variant="ghost" className="w-full justify-start">View Attendance</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
