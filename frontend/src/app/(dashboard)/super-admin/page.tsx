"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import Link from "next/link";

interface SuperAdminData {
  schools_total: number;
  students_total: number;
  teachers_total: number;
  classes_total: number;
}

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<SuperAdminData | null>(null);
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
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Super Admin Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Welcome back, {user?.email}. Here&apos;s the system-wide overview.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Total Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.schools_total}</div>
            <Link href="/schools" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-1 inline-block">Manage schools →</Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.students_total}</div>
            <Link href="/students" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-1 inline-block">Manage students →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.teachers_total}</div>
            <Link href="/teachers" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-1 inline-block">Manage teachers →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.classes_total}</div>
            <Link href="/classes" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mt-1 inline-block">Manage classes →</Link>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/schools/new"><Button variant="secondary" className="w-full justify-start">+ Create New School</Button></Link>
            <Link href="/teachers/new"><Button variant="secondary" className="w-full justify-start">+ Add New Teacher</Button></Link>
            <Link href="/classes/new"><Button variant="secondary" className="w-full justify-start">+ Create New Class</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
