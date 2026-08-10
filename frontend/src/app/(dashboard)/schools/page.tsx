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

interface School {
  id: string;
  name: string;
  address: string | null;
  status: string;
}

export default function SchoolsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/schools");
      if (!response.ok) throw new Error("Failed to fetch schools");
      const data = await response.json();
      setSchools(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN") {
      router.replace(user?.school_id ? `/schools/${user.school_id}` : "/");
      return;
    }
    let ignore = false;
    const runFetch = async () => {
      if (!ignore) {
        await fetchSchools();
      }
    };
    runFetch();
    return () => { ignore = true; };
  }, [user, router, fetchSchools]);

  if (loading) return <Loading />;
  if (error) return <ErrorState description={error} onRetry={fetchSchools} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Schools</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Manage educational institutions within Village AI Nexus.
          </p>
        </div>
        <Link href="/schools/new">
          <Button variant="primary">Create New School</Button>
        </Link>
      </div>

      {schools.length === 0 ? (
        <EmptyState 
          title="No schools yet" 
          description="Create your first school to get started." 
          actionLabel="Create School"
          actionHref="/schools/new"
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.map(school => (
              <TableRow key={school.id}>
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell>
                  <Badge variant={school.status === "ACTIVE" ? "default" : "secondary"}>
                    {school.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-[var(--muted-foreground)] max-w-xs truncate">
                  {school.address || "—"}
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
      )}
    </div>
  );
}
