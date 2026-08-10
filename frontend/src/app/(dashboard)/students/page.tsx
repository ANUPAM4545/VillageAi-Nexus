"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

interface Student {
  id: string;
  student_id: string;
  name: string;
  grade: string;
  section: string | null;
  parent_name: string | null;
  status: string;
}

export default function StudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  const [schoolId, setSchoolId] = useState("");
  const [schools, setSchools] = useState<{id: string, name: string}[]>([]);

  const fetchSchools = useCallback(async () => {
    if (user?.role !== "SUPER_ADMIN") return;
    try {
      const res = await apiClient.get("/schools");
      if (res.ok) setSchools(await res.json());
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const fetchStudents = useCallback(async () => {
    if (user?.role === "STUDENT") {
      router.replace("/");
      return;
    }
    
    if (user?.role === "SUPER_ADMIN" && !schoolId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const queryParams = new URLSearchParams();
      queryParams.set("page", page.toString());
      queryParams.set("page_size", "20");
      if (search) queryParams.set("search", search);
      if (gradeFilter) queryParams.set("grade", gradeFilter);
      if (sectionFilter) queryParams.set("section", sectionFilter);
      if (statusFilter) queryParams.set("status", statusFilter);
      if (user?.role === "SUPER_ADMIN" && schoolId) {
        queryParams.set("school_id", schoolId);
      }

      const response = await apiClient.get(`/students?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch students");
      
      const data = await response.json();
      setStudents(data.items);
      setTotalPages(data.total_pages);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, router, page, search, gradeFilter, sectionFilter, statusFilter, schoolId]);

  useEffect(() => {
    let ignore = false;
    const runFetch = async () => {
      if (!ignore) {
        await fetchSchools();
      }
    };
    runFetch();
    return () => { ignore = true; };
  }, [fetchSchools]);

  useEffect(() => {
    let ignore = false;
    const runFetch = async () => {
      if (!ignore) {
        await fetchStudents();
      }
    };
    runFetch();
    return () => { ignore = true; };
  }, [fetchStudents]);

  const canCreate = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Students</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Manage students enrolled in your school.
          </p>
        </div>
        {canCreate && (
          <Link href="/students/new">
            <Button variant="primary">Create New Student</Button>
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm flex flex-wrap gap-4 items-end">
        {user?.role === "SUPER_ADMIN" && (
          <div className="flex-1 min-w-[200px] space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">Target School</label>
            <Select
              value={schoolId}
              onChange={(e) => { setSchoolId(e.target.value); setPage(1); }}
            >
              <option value="">-- Select School --</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
        )}
        
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)]">Search</label>
          <Input
            type="text"
            placeholder="Name, ID, Parent"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        
        <div className="w-24 space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)]">Grade</label>
          <Input
            type="text"
            placeholder="All"
            value={gradeFilter}
            onChange={(e) => { setGradeFilter(e.target.value); setPage(1); }}
          />
        </div>

        <div className="w-24 space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)]">Section</label>
          <Input
            type="text"
            placeholder="All"
            value={sectionFilter}
            onChange={(e) => { setSectionFilter(e.target.value); setPage(1); }}
          />
        </div>

        <div className="w-32 space-y-2">
          <label className="text-sm font-medium text-[var(--foreground)]">Status</label>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </Select>
        </div>
      </div>

      {error && <div className="rounded-md bg-[var(--destructive)]/10 p-4 text-sm text-[var(--destructive)] font-medium">{error}</div>}

      {loading ? (
        <Loading />
      ) : students.length === 0 ? (
        <EmptyState 
          title="No students found" 
          description="Try adjusting your filters or create a new student." 
          actionLabel={canCreate ? "Create Student" : undefined}
          actionHref="/students/new"
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Grade/Section</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(student => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.student_id}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-[var(--muted-foreground)]">
                    {student.grade} {student.section ? `- ${student.section}` : ""}
                  </TableCell>
                  <TableCell className="text-[var(--muted-foreground)]">{student.parent_name || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={student.status === "ACTIVE" ? "default" : "secondary"}>
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/students/${student.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
              <span className="text-sm text-[var(--muted-foreground)]">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" size="sm"
                  disabled={page <= 1} 
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </Button>
                <Button 
                  variant="secondary" size="sm"
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
