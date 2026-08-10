"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

interface Teacher {
  id: string;
  teacher_id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  school_id: string;
}

export default function TeachersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/teachers");
      if (!response.ok) throw new Error("Failed to fetch teachers");
      const data = await response.json();
      setTeachers(data.items || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Note: The UI requirement allows Teachers to view their own profile, 
    // but the Teachers list page itself is mainly for Admins or for Teachers to just see themselves.
    // If the backend restricts the list to just themselves for Teachers, we can let them view this page.
    if (user?.role === "STUDENT") {
      router.replace("/");
      return;
    }
    let ignore = false;
    const runFetch = async () => {
      if (!ignore) {
        await fetchTeachers();
      }
    };
    runFetch();
    return () => { ignore = true; };
  }, [user, router, fetchTeachers]);

  if (loading) return <Loading />;
  if (error) return <ErrorState description={error} onRetry={fetchTeachers} />;

  const canCreate = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Teachers</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Manage teachers in your institution.
          </p>
        </div>
        {canCreate && (
          <Link href="/teachers/new">
            <Button variant="primary">Create New Teacher</Button>
          </Link>
        )}
      </div>

      {teachers.length === 0 ? (
        <EmptyState 
          title="No teachers found" 
          description={canCreate ? "Create your first teacher to get started." : "No teachers available."}
          actionLabel={canCreate ? "Create Teacher" : undefined}
          actionHref="/teachers/new"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Teacher ID</TableHead>
              <TableHead>Name & Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map(teacher => (
              <TableRow key={teacher.id}>
                <TableCell className="font-medium text-[var(--foreground)]">{teacher.teacher_id}</TableCell>
                <TableCell>
                  <div className="font-medium text-[var(--foreground)]">{teacher.name}</div>
                  <div className="text-sm text-[var(--muted-foreground)]">{teacher.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={teacher.status === "ACTIVE" ? "default" : "secondary"}>
                    {teacher.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/teachers/${teacher.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
