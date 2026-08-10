"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface Class {
  id: string;
  grade: string;
  section: string | null;
  name: string | null;
  status: string;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [studentSummary, setStudentSummary] = useState<{
    total_days: number;
    present_days: number;
    absent_days: number;
    attendance_percentage: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (user?.role === "STUDENT") {
        // Fetch student summary directly. Student ID can be resolved from user somehow, 
        // wait we need the student_id. Let's just fetch history or rely on student endpoint.
        // Actually, the API is `/api/v1/attendance/student/{student_id}`
        // It's tricky to get student_id if user object doesn't have it.
        // But Epic 6 allows fetching history to get student info.
        // Let's just use the history endpoint for students.
        const res = await apiClient.get("/attendance");
        if (!res.ok) throw new Error("Failed to fetch attendance history");
        const data = await res.json();
        
        let present = 0;
        const total = data.items?.length || 0;
        data.items?.forEach((item: { status: string }) => {
          if (item.status === "PRESENT") present++;
        });
        
        setStudentSummary({
          total_days: total,
          present_days: present,
          absent_days: total - present,
          attendance_percentage: total > 0 ? (present / total) * 100 : 0
        });
      } else {
        const response = await apiClient.get("/classes");
        if (!response.ok) throw new Error("Failed to fetch classes");
        const data = await response.json();
        setClasses(data.items || []);
      }
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    let ignore = false;
    const runFetch = async () => {
      if (!ignore) {
        await fetchData();
      }
    };
    runFetch();
    return () => { ignore = true; };
  }, [fetchData]);

  if (loading) return <Loading />;
  if (error) return <ErrorState description={error} onRetry={fetchData} />;

  if (user?.role === "STUDENT") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">My Attendance</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            View your attendance summary.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Total Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentSummary?.total_days || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Present</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{studentSummary?.present_days || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Absent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{studentSummary?.absent_days || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Percentage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentSummary?.attendance_percentage.toFixed(1) || 0}%</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const canMark = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN" || user?.role === "TEACHER";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Attendance Management</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Select a class to mark or view attendance.
          </p>
        </div>
      </div>

      {classes.length === 0 ? (
        <EmptyState 
          title="No classes found" 
          description="You are not assigned to any classes."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class Name</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Section</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((cls) => (
              <TableRow key={cls.id}>
                <TableCell className="font-medium text-[var(--foreground)]">
                  {cls.name || `${cls.grade} ${cls.section || ""}`.trim()}
                </TableCell>
                <TableCell>{cls.grade}</TableCell>
                <TableCell>{cls.section || "-"}</TableCell>
                <TableCell className="text-right">
                  {canMark && (
                    <Link href={`/attendance/${cls.id}`}>
                      <Button variant="secondary" size="sm">
                        Mark Attendance
                      </Button>
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
