"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loading } from "@/components/ui/Loading";
import Link from "next/link";

interface AssignedClass {
  class_id: string;
  grade: string;
  section: string;
  name: string;
  students_total: number;
  attendance_marked: boolean;
  attendance_percentage: number | null;
}

interface TeacherDashboardData {
  assigned_classes: AssignedClass[];
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Avoid hydration mismatch by setting time only on client
    const timer = setTimeout(() => setCurrentTime(new Date()), 0);
    return () => clearTimeout(timer);
  }, []);

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

  if (loading || !currentTime) {
    return <Loading />;
  }

  if (error || !data) {
    return (
      <ErrorState 
        title="Unable to load your dashboard" 
        description="We couldn't retrieve your teaching information."
        onRetry={() => window.location.reload()} 
      />
    );
  }

  const userName = user?.email?.split('@')[0] || "Teacher";
  const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const formattedDate = new Intl.DateTimeFormat('en-GB', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  }).format(currentTime);

  const totalClasses = data.assigned_classes.length;
  const totalStudents = data.assigned_classes.reduce((sum, cls) => sum + cls.students_total, 0);
  const classesMarkedCount = data.assigned_classes.filter(cls => cls.attendance_marked).length;
  const remainingCount = totalClasses - classesMarkedCount;
  
  const progressPercentage = totalClasses === 0 ? 0 : (classesMarkedCount / totalClasses) * 100;
  const firstUnmarkedClass = data.assigned_classes.find(cls => !cls.attendance_marked);

  return (
    <div className="space-y-12 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--foreground)] font-medium">
          {greeting}, {capitalizedName}.
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">
          Here&apos;s what&apos;s happening with your classes today.
        </p>
        <p className="mt-6 font-semibold tracking-tight text-[var(--foreground)]">
          {formattedDate}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">My Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-1">{totalClasses}</div>
            <p className="text-xs text-[var(--muted-foreground)] font-medium">Assigned</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">My Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-1">{totalStudents}</div>
            <p className="text-xs text-[var(--muted-foreground)] font-medium">Total students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Classes Marked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-1">{classesMarkedCount} / {totalClasses}</div>
            <p className="text-xs text-[var(--muted-foreground)] font-medium">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-1">{remainingCount}</div>
            <p className="text-xs text-[var(--muted-foreground)] font-medium">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Classes */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)]">Today&apos;s Classes</h2>
        
        {totalClasses === 0 ? (
          <EmptyState 
            title="No classes assigned" 
            description="You currently don't have any classes assigned to you." 
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.assigned_classes.map((cls) => (
              <Card key={cls.class_id} className="flex flex-col border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl tracking-tight">{cls.name}</CardTitle>
                    {cls.attendance_marked ? (
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        {cls.attendance_percentage?.toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-xs font-semibold tracking-wider text-[var(--muted-foreground)] uppercase">
                        Not Marked
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-sm mt-1">
                    Grade {cls.grade} · Section {cls.section}
                  </CardDescription>
                  <div className="text-sm text-[var(--foreground)] mt-2">
                    {cls.students_total} Students
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end mt-4">
                  <Link href={`/attendance/${cls.class_id}`} className="block w-full">
                    <Button variant={cls.attendance_marked ? "secondary" : "primary"} className="w-full uppercase text-xs tracking-wider font-semibold">
                      {cls.attendance_marked ? "View Attendance" : "Mark Attendance"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Today's Attendance Progress */}
      {totalClasses > 0 && (
        <div className="space-y-6 pt-6 border-t border-[var(--border)]">
          <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)]">Today&apos;s Attendance</h2>
          
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[var(--foreground)]">
                {classesMarkedCount} of {totalClasses} classes completed
              </span>
            </div>
            
            <div className="h-3 w-full bg-[var(--muted)] rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-[var(--foreground)] transition-all duration-500 ease-in-out" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-sm font-medium text-[var(--muted-foreground)]">
                {remainingCount} class{remainingCount !== 1 ? 'es' : ''} still need{remainingCount === 1 ? 's' : ''} attendance
              </span>
              
              {remainingCount > 0 && firstUnmarkedClass && (
                <Link href={`/attendance/${firstUnmarkedClass.class_id}`}>
                  <Button variant="secondary" size="sm" className="font-semibold text-xs tracking-wider uppercase">
                    Mark Remaining Attendance
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* My Classes List */}
      {totalClasses > 0 && (
        <div className="space-y-4 pt-6 border-t border-[var(--border)]">
          <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)]">My Classes</h2>
          
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="divide-y divide-[var(--border)]">
              {data.assigned_classes.map((cls) => (
                <div key={cls.class_id} className="flex items-center justify-between p-4 hover:bg-[var(--muted)]/30 transition-colors">
                  <div className="flex items-center gap-4 sm:gap-8">
                    <span className="font-semibold text-[var(--foreground)] w-24 truncate">{cls.name}</span>
                    <span className="text-sm text-[var(--muted-foreground)] hidden sm:inline-block">Grade {cls.grade} / Section {cls.section}</span>
                    <span className="text-sm font-medium text-[var(--foreground)]">{cls.students_total} Students</span>
                  </div>
                  <Link href={`/classes/${cls.class_id}`}>
                    <Button variant="ghost" size="sm" className="text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                      View
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-4 pt-6 border-t border-[var(--border)]">
        <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)]">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          {firstUnmarkedClass ? (
            <Link href={`/attendance/${firstUnmarkedClass.class_id}`}>
              <Button variant="primary" className="uppercase text-xs tracking-wider font-semibold">Mark Attendance</Button>
            </Link>
          ) : (
            <Button variant="secondary" disabled className="uppercase text-xs tracking-wider font-semibold">All Attendance Marked</Button>
          )}
          <Link href="/classes">
            <Button variant="secondary" className="uppercase text-xs tracking-wider font-semibold">My Classes</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
