"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loading } from "@/components/ui/Loading";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import Link from "next/link";

interface SuperAdminData {
  schools_total: number;
  students_total: number;
  teachers_total: number;
  classes_total: number;
}

interface School {
  id: string;
  name: string;
  address: string | null;
  contact_email: string | null;
  status: string;
}

export default function SuperAdminDashboard() {
  useAuth();
  const [data, setData] = useState<SuperAdminData | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [dashboardRes, schoolsRes] = await Promise.all([
          apiClient.get("/dashboard/"),
          apiClient.get("/schools")
        ]);
        
        if (!dashboardRes.ok) throw new Error("Failed to load dashboard data");
        if (!schoolsRes.ok) throw new Error("Failed to load schools data");
        
        const dashboardData = await dashboardRes.json();
        const schoolsData = await schoolsRes.json();
        
        setData(dashboardData);
        // Only take the top 5 schools for the dashboard overview
        setSchools(schoolsData.slice(0, 5));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <Loading />;
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
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          System-wide overview of Village AI Nexus.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Total Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.schools_total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.students_total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.teachers_total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{data.classes_total}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schools Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Schools</h2>
        </div>
        
        {schools.length === 0 ? (
          <EmptyState 
            title="No schools yet" 
            description="Create your first school to begin managing Village AI Nexus." 
            actionLabel="Create School"
            actionHref="/schools/new"
          />
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map(school => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell className="text-[var(--muted-foreground)]">
                      {school.address || "—"}
                    </TableCell>
                    <TableCell className="text-[var(--muted-foreground)]">
                      {school.contact_email || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={school.status === "ACTIVE" ? "default" : "secondary"}>
                        {school.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/schools/${school.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end">
              <Link href="/schools" className="text-sm font-medium hover:underline text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                View all schools &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4 pt-4 border-t border-[var(--border)]">
        <h2 className="text-xl font-semibold tracking-tight">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/schools/new">
            <Button variant="primary">+ Create School</Button>
          </Link>
          <Link href="/schools">
            <Button variant="secondary">View Schools</Button>
          </Link>
          <Link href="/students">
            <Button variant="secondary">View Students</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
