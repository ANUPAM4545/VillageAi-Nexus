"use client";

import { useState, useEffect } from "react";
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

interface DashboardStats {
  students_total: number;
  teachers_total: number;
  classes_total: number;
  attendance: {
    present: number;
    absent: number;
    not_marked: number;
    percentage: number;
  };
}

interface SchoolInfo {
  id: string;
  name: string;
  status: string;
  address?: string;
  contact_email?: string;
}

interface StudentPreview {
  id: string;
  student_id: string;
  name: string;
  grade: string;
  section: string | null;
  status: string;
}

interface TeacherPreview {
  id: string;
  name: string;
  status: string;
}

interface ClassPreview {
  id: string;
  name: string;
  grade: string;
  section: string | null;
  status: string;
}

export default function SchoolAdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentStudents, setRecentStudents] = useState<StudentPreview[]>([]);
  const [teachers, setTeachers] = useState<TeacherPreview[]>([]);
  const [classes, setClasses] = useState<ClassPreview[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    if (user?.role !== "SCHOOL_ADMIN") {
      router.replace("/");
      return;
    }

    // Set greeting based on local time
    const hour = new Date().getHours();
    let currentGreeting = "Good morning";
    if (hour >= 12 && hour < 17) currentGreeting = "Good afternoon";
    else if (hour >= 17) currentGreeting = "Good evening";
    
    // Defer setState to avoid "Calling setState synchronously within an effect" warning
    setTimeout(() => {
      setGreeting(currentGreeting);
    }, 0);

    let ignore = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const tasks = [
          apiClient.get(`/schools/${user.school_id}`).then(res => res.json()),
          apiClient.get(`/dashboard/`).then(res => res.json()),
          apiClient.get(`/students?page_size=5`).then(res => res.json()),
          apiClient.get(`/teachers?page_size=3`).then(res => res.json()),
          apiClient.get(`/classes?page_size=3`).then(res => res.json())
        ];

        const [schoolRes, statsRes, studentsRes, teachersRes, classesRes] = await Promise.allSettled(tasks);

        if (ignore) return;

        // Verify critical components (School & Stats)
        if (schoolRes.status === "rejected" || statsRes.status === "rejected") {
          throw new Error("Unable to retrieve essential dashboard metrics.");
        }

        setSchool(schoolRes.value);
        setStats(statsRes.value);

        if (studentsRes.status === "fulfilled") setRecentStudents(studentsRes.value.items || []);
        if (teachersRes.status === "fulfilled") setTeachers(teachersRes.value.items || []);
        if (classesRes.status === "fulfilled") setClasses(classesRes.value.items || []);

      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      ignore = true;
    };
  }, [user, router]);

  if (loading) return <Loading />;
  if (error || !school || !stats) return <ErrorState title="Unable to load dashboard" description={error || "We couldn't retrieve your school's information."} />;

  // Display Name
  const adminName = user?.email?.split("@")[0].replace(/[^a-zA-Z]/g, " ") || "Admin";
  const capitalizedAdmin = adminName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // Formatting Date
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = new Date().toLocaleDateString('en-GB', dateOptions);

  // Attendance Calculations
  const { present, absent, not_marked } = stats.attendance;
  const totalStudents = stats.students_total;
  const isMarked = present + absent > 0;
  
  let attendanceStr = "Not Marked";
  if (isMarked && totalStudents > 0) {
    attendanceStr = `${((present / totalStudents) * 100).toFixed(1)}%`;
  }

  const progressPresent = totalStudents > 0 ? (present / totalStudents) * 100 : 0;
  const progressAbsent = totalStudents > 0 ? (absent / totalStudents) * 100 : 0;

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 relative">
        <div className="absolute top-0 right-0 hidden md:block">
          <Badge variant="outline" className="uppercase tracking-widest text-xs font-semibold py-1">
            {school.name} &middot; {school.status}
          </Badge>
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">{greeting}, {capitalizedAdmin}.</h1>
          <p className="mt-2 text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            Here&apos;s what&apos;s happening at {school.name} today.
          </p>
          <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">{formattedDate}</p>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">STUDENTS</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{stats.students_total}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">Total students</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">TEACHERS</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{stats.teachers_total}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">Active teachers</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">CLASSES</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{stats.classes_total}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">Active classes</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">TODAY&apos;S ATTENDANCE</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{attendanceStr}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">School attendance</p>
        </div>
      </div>

      {/* MIDDLE SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ATTENDANCE BAR */}
        <div className="lg:col-span-2 bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)] mb-1">Today&apos;s Attendance</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-6">Attendance across your school today.</p>
          </div>
          
          {!isMarked ? (
             <div>
               <p className="text-xl font-bold text-[var(--foreground)] mb-2">Not Marked</p>
               <p className="text-sm text-[var(--muted-foreground)] mb-6">Attendance has not been recorded yet for today.</p>
             </div>
          ) : (
            <div className="space-y-6 mt-auto">
              <div className="flex justify-between items-end mb-2">
                <p className="text-4xl font-bold text-[var(--foreground)]">{attendanceStr}</p>
              </div>
              
              <div className="h-4 w-full bg-[var(--muted)] rounded-full overflow-hidden flex">
                <div className="h-full bg-[var(--foreground)]" style={{ width: `${progressPresent}%` }} />
                <div className="h-full bg-[var(--foreground)] opacity-30" style={{ width: `${progressAbsent}%` }} />
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm font-medium pt-2">
                <div>
                  <span className="text-[var(--muted-foreground)] block uppercase text-xs tracking-wider mb-1">Present</span>
                  <span className="text-[var(--foreground)] text-xl">{present}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block uppercase text-xs tracking-wider mb-1">Absent</span>
                  <span className="text-[var(--foreground)] text-xl">{absent}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block uppercase text-xs tracking-wider mb-1">Not Marked</span>
                  <span className="text-[var(--foreground)] text-xl">{not_marked}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SCHOOL OVERVIEW */}
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
          <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)] mb-6">School Overview</h2>
          <dl className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]/50">
              <dt className="text-sm font-medium text-[var(--muted-foreground)] uppercase">School Name</dt>
              <dd className="text-sm font-bold text-[var(--foreground)]">{school.name}</dd>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]/50">
              <dt className="text-sm font-medium text-[var(--muted-foreground)] uppercase">Status</dt>
              <dd>
                <Badge variant={school.status === "ACTIVE" ? "default" : "secondary"}>
                  {school.status}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]/50">
              <dt className="text-sm font-medium text-[var(--muted-foreground)] uppercase">Students</dt>
              <dd className="text-sm font-bold text-[var(--foreground)]">{stats.students_total}</dd>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]/50">
              <dt className="text-sm font-medium text-[var(--muted-foreground)] uppercase">Teachers</dt>
              <dd className="text-sm font-bold text-[var(--foreground)]">{stats.teachers_total}</dd>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-[var(--border)]/50">
              <dt className="text-sm font-medium text-[var(--muted-foreground)] uppercase">Classes</dt>
              <dd className="text-sm font-bold text-[var(--foreground)]">{stats.classes_total}</dd>
            </div>
            {school.contact_email && (
              <div className="flex justify-between items-center pt-2">
                <dt className="text-sm font-medium text-[var(--muted-foreground)] uppercase">Contact</dt>
                <dd className="text-sm font-bold text-[var(--foreground)]">{school.contact_email}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="pt-8 border-t border-[var(--border)]">
        <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)] mb-6">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link href="/students/new">
            <Button variant="outline" className="h-12 px-6 font-semibold text-xs tracking-wider uppercase border-2">
              + Add Student
            </Button>
          </Link>
          <Link href="/teachers/new">
            <Button variant="outline" className="h-12 px-6 font-semibold text-xs tracking-wider uppercase border-2">
              + Add Teacher
            </Button>
          </Link>
          <Link href="/classes/new">
            <Button variant="outline" className="h-12 px-6 font-semibold text-xs tracking-wider uppercase border-2">
              + Create Class
            </Button>
          </Link>
          <Link href="/attendance">
            <Button variant="secondary" className="h-12 px-6 font-semibold text-xs tracking-wider uppercase">
              View Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* STUDENTS DIRECTORY PREVIEW */}
      <div className="pt-8 border-t border-[var(--border)]">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)]">Student Directory</h2>
        </div>
        {recentStudents.length === 0 ? (
          <EmptyState title="No students yet" description="Add your first student to get started." />
        ) : (
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">Student ID</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">Student</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">Grade</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">Section</TableHead>
                  <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentStudents.map(st => (
                  <TableRow key={st.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                    <TableCell className="font-medium text-[var(--foreground)]">{st.student_id}</TableCell>
                    <TableCell className="font-semibold text-[var(--foreground)]">{st.name}</TableCell>
                    <TableCell className="text-[var(--foreground)]">{st.grade}</TableCell>
                    <TableCell className="text-[var(--muted-foreground)]">{st.section || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={st.status === "ACTIVE" ? "default" : "secondary"}>
                        {st.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--muted)]/10 text-right">
               <Link href="/students" className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] hover:underline">
                 View All Students &rarr;
               </Link>
            </div>
          </div>
        )}
      </div>

      {/* TEACHERS & CLASSES PREVIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-[var(--border)]">
        
        {/* TEACHERS */}
        <div>
          <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)] mb-6">Teachers</h2>
          {teachers.length === 0 ? (
            <EmptyState title="No teachers yet" description="Add your first teacher to get started." />
          ) : (
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">Teacher</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)] text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map(t => (
                    <TableRow key={t.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                      <TableCell className="font-semibold text-[var(--foreground)]">{t.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={t.status === "ACTIVE" ? "default" : "secondary"}>
                          {t.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--muted)]/10 text-right">
                 <Link href="/teachers" className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] hover:underline">
                   View All Teachers &rarr;
                 </Link>
              </div>
            </div>
          )}
        </div>

        {/* CLASSES */}
        <div>
          <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)] mb-6">Classes</h2>
          {classes.length === 0 ? (
            <EmptyState title="No classes yet" description="Create your first class to get started." />
          ) : (
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">Class</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)]">Grade</TableHead>
                    <TableHead className="font-semibold text-xs tracking-wider uppercase text-[var(--muted-foreground)] text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map(c => (
                    <TableRow key={c.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                      <TableCell className="font-semibold text-[var(--foreground)]">
                        {c.name || `${c.grade}${c.section ? `-${c.section}` : ""}`}
                      </TableCell>
                      <TableCell className="text-[var(--foreground)]">{c.grade}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>
                          {c.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--muted)]/10 text-right">
                 <Link href="/classes" className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] hover:underline">
                   View All Classes &rarr;
                 </Link>
              </div>
            </div>
          )}
        </div>

      </div>
      
    </div>
  );
}
