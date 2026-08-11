"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
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

interface Student {
  id: string;
  student_id: string;
  name: string;
  guardian_name: string | null;
  status: string;
}

interface AttendanceSummary {
  total_students: number;
  present: number;
  absent: number;
  attendance_percentage: number;
}

export default function ClassWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  
  const [cls, setCls] = useState<Class | null>(null);
  const [teacherName, setTeacherName] = useState<string>("Assigned Teacher");
  
  const [students, setStudents] = useState<Student[]>([]);
  const [studentTotal, setStudentTotal] = useState<number>(0);
  const [studentTotalPages, setStudentTotalPages] = useState<number>(1);
  const [studentPage, setStudentPage] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchClassDetails = useCallback(async () => {
    try {
      const response = await apiClient.get(`/classes/${id}`);
      if (!response.ok) {
        if (response.status === 404 || response.status === 403) {
          throw new Error("Class not found or access denied");
        }
        throw new Error("Failed to fetch class details");
      }
      return await response.json();
    } catch (err: unknown) {
      if (err instanceof Error) throw err;
      throw new Error("Unknown error occurred");
    }
  }, [id]);

  const fetchStudents = useCallback(async (grade: string, section: string | null, page: number, search: string) => {
    try {
      let url = `/students?grade=${encodeURIComponent(grade)}&page=${page}&page_size=10`;
      if (section) url += `&section=${encodeURIComponent(section)}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      
      const res = await apiClient.get(url);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.items || []);
        setStudentTotal(data.total || 0);
        setStudentTotalPages(data.total_pages || 1);
      }
    } catch {
      // Ignore non-fatal student fetch errors
    }
  }, []);

  const fetchAttendance = useCallback(async (grade: string, section: string | null) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      let url = `/attendance/summary?target_date=${today}&class_grade=${encodeURIComponent(grade)}`;
      if (section) url += `&class_section=${encodeURIComponent(section)}`;
      
      const res = await apiClient.get(url);
      if (res.ok) {
        const data = await res.json();
        setAttendance(data);
      }
    } catch {
      // Ignore non-fatal attendance fetch errors
    }
  }, []);

  const fetchTeacher = useCallback(async (teacherId: string) => {
    try {
      const res = await apiClient.get(`/teachers/${teacherId}`);
      if (res.ok) {
        const data = await res.json();
        setTeacherName(data.name || "Assigned Teacher");
      } else {
        setTeacherName("Assigned Teacher");
      }
    } catch {
      setTeacherName("Assigned Teacher");
    }
  }, []);

  useEffect(() => {
    if (user?.role === "STUDENT") {
      router.replace("/");
      return;
    }

    let ignore = false;

    const loadWorkspace = async () => {
      setLoading(true);
      setError("");
      try {
        const classData = await fetchClassDetails();
        if (ignore) return;
        setCls(classData);

        // Parallel fetches using class details
        const tasks = [];
        tasks.push(fetchStudents(classData.grade, classData.section, studentPage, searchQuery));
        tasks.push(fetchAttendance(classData.grade, classData.section));
        
        if (classData.teacher_id) {
          tasks.push(fetchTeacher(classData.teacher_id));
        }

        await Promise.allSettled(tasks);
      } catch (err: unknown) {
        if (!ignore && err instanceof Error) {
          setError(err.message);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadWorkspace();

    return () => {
      ignore = true;
    };
  }, [user, router, fetchClassDetails, fetchStudents, fetchAttendance, fetchTeacher, studentPage, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchInput(val);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(val);
      setStudentPage(1);
    }, 500);
  };

  if (loading && !cls) return <Loading />;
  if (error && !cls) return <ErrorState title="Unable to load class" description={error} />;
  if (!cls) return <ErrorState title="Class not found" description="We couldn't retrieve this class information." />;

  const displayName = cls.name || `${cls.grade}${cls.section ? `-${cls.section}` : ""}`;
  const displaySection = cls.section ? ` · Section ${cls.section}` : "";
  const schoolName = "Your School"; // Obfuscated school UUID logic

  // Attendance Calculations
  const present = attendance?.present || 0;
  const absent = attendance?.absent || 0;
  const totalMarked = present + absent;
  const isMarked = totalMarked > 0;
  const notMarkedCount = Math.max(0, studentTotal - totalMarked);
  
  let percentageStr = "Not Marked";
  if (isMarked && studentTotal > 0) {
    percentageStr = `${((present / studentTotal) * 100).toFixed(1)}%`;
  } else if (isMarked && studentTotal === 0) {
    // Fallback if mismatch
    percentageStr = `${((present / totalMarked) * 100).toFixed(1)}%`;
  }

  const progressPresent = studentTotal > 0 ? (present / studentTotal) * 100 : 0;
  const progressAbsent = studentTotal > 0 ? (absent / studentTotal) * 100 : 0;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <Link href="/classes" className="text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1 mb-4">
            &larr; Back to Classes
          </Link>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] uppercase">{displayName}</h1>
          <p className="mt-2 text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            Grade {cls.grade} {displaySection} &middot; {schoolName}
          </p>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">TOTAL STUDENTS</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{studentTotal}</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">PRESENT TODAY</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{isMarked ? present : "—"}</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">ABSENT TODAY</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{isMarked ? absent : "—"}</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">ATTENDANCE</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{percentageStr}</p>
        </div>
      </div>

      {/* QUICK ACTIONS & OVERVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)]">Quick Actions</h2>
          </div>
          <div className="flex flex-wrap gap-4">
            {isMarked ? (
              <Link href={`/attendance/${cls.id}`}>
                <Button variant="secondary" className="h-14 px-8 font-semibold text-sm tracking-wider uppercase border-2">
                  View Attendance
                </Button>
              </Link>
            ) : (
              <Link href={`/attendance/${cls.id}`}>
                <Button variant="primary" className="h-14 px-8 font-semibold text-sm tracking-wider uppercase">
                  Mark Attendance
                </Button>
              </Link>
            )}
          </div>

          <div className="pt-6 border-t border-[var(--border)]">
            <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)] mb-6">Today&apos;s Attendance</h2>
            
            {!isMarked ? (
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
                <p className="text-xl font-bold text-[var(--foreground)] mb-2">Not Marked</p>
                <p className="text-sm text-[var(--muted-foreground)] mb-6">Attendance has not been recorded for this class today.</p>
                <Link href={`/attendance/${cls.id}`}>
                  <Button variant="primary" size="sm" className="font-semibold text-xs tracking-wider uppercase">
                    Mark Attendance
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 space-y-6">
                <p className="text-3xl font-bold text-[var(--foreground)]">{percentageStr}</p>
                
                <div className="h-4 w-full bg-[var(--muted)] rounded-full overflow-hidden flex">
                  <div className="h-full bg-[var(--foreground)]" style={{ width: `${progressPresent}%` }} />
                  <div className="h-full bg-[var(--foreground)] opacity-30" style={{ width: `${progressAbsent}%` }} />
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm font-medium">
                  <div>
                    <span className="text-[var(--muted-foreground)] block">Present</span>
                    <span className="text-[var(--foreground)] text-lg">{present}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)] block">Absent</span>
                    <span className="text-[var(--foreground)] text-lg">{absent}</span>
                  </div>
                  <div>
                    <span className="text-[var(--muted-foreground)] block">Not Marked</span>
                    <span className="text-[var(--foreground)] text-lg">{notMarkedCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)] mb-6">Class Overview</h2>
          <dl className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]/50">
              <dt className="text-sm font-medium text-[var(--muted-foreground)] uppercase">Class</dt>
              <dd className="text-sm font-bold text-[var(--foreground)]">{displayName}</dd>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]/50">
              <dt className="text-sm font-medium text-[var(--muted-foreground)] uppercase">Grade</dt>
              <dd className="text-sm font-bold text-[var(--foreground)]">{cls.grade}</dd>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]/50">
              <dt className="text-sm font-medium text-[var(--muted-foreground)] uppercase">Section</dt>
              <dd className="text-sm font-bold text-[var(--foreground)]">{cls.section || "—"}</dd>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]/50">
              <dt className="text-sm font-medium text-[var(--muted-foreground)] uppercase">School</dt>
              <dd className="text-sm font-bold text-[var(--foreground)]">{schoolName}</dd>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]/50">
              <dt className="text-sm font-medium text-[var(--muted-foreground)] uppercase">Teacher</dt>
              <dd className="text-sm font-bold text-[var(--foreground)]">{teacherName}</dd>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]/50">
              <dt className="text-sm font-medium text-[var(--muted-foreground)] uppercase">Students</dt>
              <dd className="text-sm font-bold text-[var(--foreground)]">{studentTotal}</dd>
            </div>
            <div className="flex justify-between items-center pt-2">
              <dt className="text-sm font-medium text-[var(--muted-foreground)] uppercase">Status</dt>
              <dd>
                <Badge variant={cls.status === "ACTIVE" ? "default" : "secondary"}>
                  {cls.status}
                </Badge>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* STUDENTS DIRECTORY */}
      <div className="pt-8 border-t border-[var(--border)]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)]">Students</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">{studentTotal} students in this class.</p>
          </div>
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search students..."
              value={searchInput}
              onChange={handleSearchChange}
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm ring-offset-[var(--background)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {students.length === 0 ? (
          <EmptyState 
            title="No students found" 
            description={searchQuery ? "Try adjusting your search query." : "No students are assigned to this class yet."}
          />
        ) : (
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">Student ID</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">Student</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">Parent/Guardian</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">Status</TableHead>
                  <TableHead className="text-right font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(st => (
                  <TableRow key={st.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                    <TableCell className="font-medium text-[var(--foreground)]">{st.student_id}</TableCell>
                    <TableCell className="font-semibold text-[var(--foreground)]">{st.name}</TableCell>
                    <TableCell className="text-[var(--muted-foreground)]">{st.guardian_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={st.status === "ACTIVE" ? "default" : "secondary"}>
                        {st.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/students/${st.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs font-semibold uppercase tracking-wide">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {studentTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)] bg-[var(--muted)]/10">
                <div className="text-sm text-[var(--muted-foreground)]">
                  Page <span className="font-medium text-[var(--foreground)]">{studentPage}</span> of <span className="font-medium text-[var(--foreground)]">{studentTotalPages}</span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={studentPage <= 1}
                    onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={studentPage >= studentTotalPages}
                    onClick={() => setStudentPage(p => Math.min(studentTotalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
