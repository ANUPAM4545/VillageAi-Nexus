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

interface Class {
  id: string;
  grade: string;
  section: string | null;
  name: string | null;
  status: string;
  school_id: string;
  teacher_id: string | null;
}

export default function ClassesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/classes");
      if (!response.ok) throw new Error("Failed to fetch classes");
      const data = await response.json();
      setClasses(data.items || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "STUDENT") {
      router.replace("/");
      return;
    }
    let ignore = false;
    const runFetch = async () => {
      if (!ignore) {
        await fetchClasses();
      }
    };
    runFetch();
    return () => { ignore = true; };
  }, [user, router, fetchClasses]);

  if (loading) return <Loading />;
  if (error) return <ErrorState description={error} onRetry={fetchClasses} />;

  const canCreate = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Classes</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Manage classes and sections in your school.
          </p>
        </div>
        {canCreate && (
          <Link href="/classes/new">
            <Button variant="primary">Create New Class</Button>
          </Link>
        )}
      </div>

      {classes.length === 0 ? (
        <EmptyState 
          title="No classes found" 
          description={canCreate ? "Create your first class to get started." : "No classes assigned."}
          actionLabel={canCreate ? "Create Class" : undefined}
          actionHref="/classes/new"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Grade/Section</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map(cls => (
              <TableRow key={cls.id}>
                <TableCell className="font-medium text-[var(--foreground)]">
                  {cls.name || "Untitled Class"}
                </TableCell>
                <TableCell className="text-[var(--muted-foreground)]">
                  Grade {cls.grade} {cls.section && `- Section ${cls.section}`}
                </TableCell>
                <TableCell>
                  <Badge variant={cls.status === "ACTIVE" ? "default" : "secondary"}>
                    {cls.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/classes/${cls.id}`}>
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
