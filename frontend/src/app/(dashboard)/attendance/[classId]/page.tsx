"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import Link from "next/link";

interface Class {
  id: string;
  grade: string;
  section: string | null;
  name: string | null;
}

interface Student {
  id: string;
  student_id: string;
  name: string;
  status: string;
}

export default function MarkAttendancePage() {
  const { classId } = useParams() as { classId: string };
  const router = useRouter();

  const [classData, setClassData] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // local state for attendance selection: "PRESENT" | "ABSENT"
  const [attendanceState, setAttendanceState] = useState<Record<string, "PRESENT" | "ABSENT">>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch class details to get grade and section
      const classRes = await apiClient.get(`/classes/${classId}`);
      if (!classRes.ok) throw new Error("Failed to fetch class details");
      const cls = await classRes.json();
      setClassData(cls);

      // 2. Fetch students for this class based on grade and section
      let studentsUrl = `/students?page_size=100&grade=${cls.grade}`;
      if (cls.section) {
        studentsUrl += `&section=${cls.section}`;
      }
      const studentsRes = await apiClient.get(studentsUrl);
      if (!studentsRes.ok) throw new Error("Failed to fetch students");
      const studentsData = await studentsRes.json();
      setStudents(studentsData.items || []);

      // Initialize default state to PRESENT for all active students
      const initialState: Record<string, "PRESENT" | "ABSENT"> = {};
      (studentsData.items || []).forEach((s: Student) => {
        initialState[s.id] = "PRESENT";
      });
      setAttendanceState(initialState);
      
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [classId]);

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

  const handleMarkAttendance = (studentId: string, status: "PRESENT" | "ABSENT") => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const records = Object.entries(attendanceState).map(([student_id, status]) => ({
        student_id,
        status
      }));

      const payload = {
        date: new Date().toISOString().split("T")[0],
        records
      };

      const res = await apiClient.post(`/classes/${classId}/attendance`, payload);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to submit attendance");
      }
      
      // Redirect or show success
      router.push("/attendance");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorState description={error} onRetry={fetchData} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/attendance">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            &larr;
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Mark Attendance
          </h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {classData?.name || `${classData?.grade} ${classData?.section || ""}`.trim()} • {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--muted)]/30">
          <h2 className="font-medium text-[var(--foreground)]">Student List</h2>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            disabled={submitting || students.length === 0}
          >
            {submitting ? "Submitting..." : "Submit Attendance"}
          </Button>
        </div>
        
        {students.length === 0 ? (
          <div className="p-8 text-center text-[var(--muted-foreground)]">
            No students found for this class.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="text-right">Attendance Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-[var(--muted-foreground)]">{student.student_id}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant={attendanceState[student.id] === "PRESENT" ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleMarkAttendance(student.id, "PRESENT")}
                        className={attendanceState[student.id] === "PRESENT" ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : ""}
                      >
                        Present
                      </Button>
                      <Button
                        variant={attendanceState[student.id] === "ABSENT" ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleMarkAttendance(student.id, "ABSENT")}
                        className={attendanceState[student.id] === "ABSENT" ? "bg-red-600 hover:bg-red-700 text-white border-red-600" : ""}
                      >
                        Absent
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
