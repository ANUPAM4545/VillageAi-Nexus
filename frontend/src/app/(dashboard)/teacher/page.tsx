"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Badge } from "@/components/ui/Badge";
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
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Teacher Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Good morning, {user?.email}. Here are your classes for today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Your Classes</CardTitle>
            <CardDescription>Classes assigned to you and today&apos;s attendance status.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.assigned_classes.length === 0 ? (
              <p className="text-sm text-[var(--muted-foreground)]">You have no assigned classes.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.assigned_classes.map((cls) => (
                  <Card key={cls.class_id} className="bg-[var(--background)] border shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{cls.name}</CardTitle>
                        {cls.attendance_marked ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                            {cls.attendance_percentage?.toFixed(0)}% Present
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[var(--muted-foreground)]">Not Marked</Badge>
                        )}
                      </div>
                      <CardDescription>{cls.students_total} Students</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={`/attendance/${cls.class_id}`}>
                        <Button variant={cls.attendance_marked ? "secondary" : "primary"} className="w-full">
                          {cls.attendance_marked ? "View Attendance" : "Mark Attendance"}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
