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

interface RecentAttendance {
  date: string;
  status: string;
}

interface DashboardStats {
  student_id: string | null;
  student_display_id: string | null;
  student_name: string | null;
  student_status: string | null;
  class_id: string | null;
  class_name: string | null;
  class_grade: string | null;
  class_section: string | null;
  teacher_name: string | null;
  school_name: string | null;
  attendance_percentage: number;
  present_days: number;
  absent_days: number;
  total_days: number;
  recent_attendance: RecentAttendance[];
}

interface AIConversation {
  id: string;
  title: string;
  created_at: string;
}

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    // Set greeting based on local time after mount to avoid hydration mismatch
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) {
      setTimeout(() => setGreeting("Good afternoon"), 0);
    } else if (hour >= 17) {
      setTimeout(() => setGreeting("Good evening"), 0);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "STUDENT") {
      router.replace("/");
      return;
    }

    let ignore = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        const tasks = [
          apiClient.get(`/dashboard/`).then(res => res.json()),
          apiClient.get(`/ai/conversations?limit=3`).then(res => res.json())
        ];

        const [statsRes, aiRes] = await Promise.allSettled(tasks);

        if (ignore) return;

        if (statsRes.status === "rejected") {
          throw new Error("Unable to retrieve your school information.");
        }

        setStats(statsRes.value);

        if (aiRes.status === "fulfilled" && aiRes.value?.items) {
          setConversations(aiRes.value.items);
        }

      } catch (err: unknown) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Unable to load your dashboard.");
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
  if (error || !stats) return <ErrorState title="Unable to load your dashboard" description={error || "We couldn't retrieve your school information."} />;

  // Display Name logic (fallback to Auth token email if profile isn't fully linked yet)
  const studentName = stats.student_name || (user?.email?.split("@")[0].replace(/[^a-zA-Z]/g, " ") || "Student");
  const capitalizedName = studentName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

  // Formatting Date
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = new Date().toLocaleDateString('en-GB', dateOptions);

  // Attendance Calculations
  const isMarked = stats.total_days > 0;
  let attendanceStr = "Not Available Yet";
  if (isMarked) {
    attendanceStr = `${stats.attendance_percentage.toFixed(1)}%`;
  }

  const progressPresent = stats.total_days > 0 ? (stats.present_days / stats.total_days) * 100 : 0;
  
  // Resolve today's attendance status
  const todayStr = new Date().toISOString().split('T')[0];
  const recentAtt = stats.recent_attendance || [];
  const todayRecord = recentAtt.find(r => r.date.startsWith(todayStr));
  const todayStatus = todayRecord ? todayRecord.status : "NOT MARKED";

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)]">{greeting}, {capitalizedName}.</h1>
          <p className="mt-2 text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wide">
            Here&apos;s your school overview for today.
          </p>
          <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">{formattedDate}</p>
        </div>
      </div>

      {/* STUDENT IDENTITY CARD */}
      <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-[var(--background)] text-2xl font-bold">
          {capitalizedName.charAt(0)}
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Student</p>
            <p className="font-bold text-[var(--foreground)]">{capitalizedName}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Student ID</p>
            <p className="font-medium text-[var(--foreground)]">{stats.student_display_id || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Class</p>
            <p className="font-medium text-[var(--foreground)]">
              {stats.class_grade ? `${stats.class_grade}${stats.class_section ? `-${stats.class_section}` : ""}` : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">School</p>
            <p className="font-medium text-[var(--foreground)]">{stats.school_name || "Your School"}</p>
          </div>
        </div>
        <div className="shrink-0 self-start">
          <Badge variant={stats.student_status === "ACTIVE" ? "default" : "secondary"}>
            {stats.student_status || "ACTIVE"}
          </Badge>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">ATTENDANCE</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{attendanceStr}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">Overall attendance</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">PRESENT</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{stats.present_days}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">Days present</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">ABSENT</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{stats.absent_days}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">Days absent</p>
        </div>
        <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-5 shadow-sm">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">TOTAL DAYS</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">{stats.total_days}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-2">Recorded days</p>
        </div>
      </div>

      {/* MIDDLE SECTION: ATTENDANCE & TODAY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ATTENDANCE BAR */}
        <div className="lg:col-span-2 bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)] mb-1">My Attendance</h2>
          </div>
          
          {!isMarked ? (
             <div className="mt-6">
               <p className="text-xl font-bold text-[var(--foreground)] mb-2">Not Available Yet</p>
               <p className="text-sm text-[var(--muted-foreground)]">No attendance has been recorded yet.</p>
             </div>
          ) : (
            <div className="space-y-6 mt-6">
              <div className="flex justify-between items-end mb-2">
                <p className="text-4xl font-bold text-[var(--foreground)]">{attendanceStr}</p>
              </div>
              
              <div className="h-4 w-full bg-[var(--muted)] rounded-full overflow-hidden flex">
                <div className="h-full bg-[var(--foreground)]" style={{ width: `${progressPresent}%` }} />
                <div className="h-full bg-[var(--foreground)] opacity-20" style={{ width: `${100 - progressPresent}%` }} />
              </div>
              
              <div className="flex gap-8 text-sm font-medium pt-2">
                <div>
                  <span className="text-[var(--foreground)] font-bold">{stats.present_days}</span>
                  <span className="text-[var(--muted-foreground)] ml-1">Present</span>
                </div>
                <div>
                  <span className="text-[var(--foreground)] font-bold">{stats.absent_days}</span>
                  <span className="text-[var(--muted-foreground)] ml-1">Absent</span>
                </div>
                <div>
                  <span className="text-[var(--foreground)] font-bold">{stats.total_days}</span>
                  <span className="text-[var(--muted-foreground)] ml-1">Total</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-[var(--border)]/50">
                <p className="text-sm font-medium text-[var(--muted-foreground)]">
                  {stats.attendance_percentage >= 90 ? "You're doing well. Keep maintaining your attendance." : "Your attendance is currently below the recommended level."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* TODAY & MY CLASS */}
        <div className="space-y-6">
          <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--muted-foreground)] mb-4">Today</h2>
            <p className="text-sm text-[var(--muted-foreground)] mb-2">Today&apos;s attendance status:</p>
            <p className="text-2xl font-bold tracking-tight text-[var(--foreground)] uppercase">
              {todayStatus}
            </p>
          </div>
          
          <div id="my-class" className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 scroll-mt-24">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-[var(--muted-foreground)] mb-4">My Class</h2>
            {stats.class_grade ? (
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Class</dt>
                  <dd className="text-lg font-bold text-[var(--foreground)]">
                    {stats.class_grade}{stats.class_section ? `-${stats.class_section}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-[var(--muted-foreground)] uppercase mt-2">Grade &middot; Section</dt>
                  <dd className="text-sm font-medium text-[var(--foreground)]">Grade {stats.class_grade} &middot; Section {stats.class_section || "—"}</dd>
                </div>
                <div className="pt-2">
                  <dt className="text-xs font-medium text-[var(--muted-foreground)] uppercase">Teacher</dt>
                  <dd className="text-sm font-medium text-[var(--foreground)]">{stats.teacher_name || "Assigned Teacher"}</dd>
                </div>
              </dl>
            ) : (
               <p className="text-sm text-[var(--muted-foreground)]">No class information available.</p>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: RECENT ATTENDANCE & AI ASSISTANT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-[var(--border)]">
        
        {/* RECENT ATTENDANCE */}
        <div>
          <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)] mb-6">Recent Attendance</h2>
          {(stats.recent_attendance || []).length === 0 ? (
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 flex items-center justify-center h-40">
              <p className="text-sm text-[var(--muted-foreground)]">No attendance recorded yet.</p>
            </div>
          ) : (
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="divide-y divide-[var(--border)]">
                {(stats.recent_attendance || []).map((record, i) => (
                  <div key={i} className="flex justify-between items-center p-4 hover:bg-[var(--muted)]/20 transition-colors">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <Badge variant={record.status === "PRESENT" ? "default" : record.status === "ABSENT" ? "secondary" : "outline"} className="uppercase text-[10px]">
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--muted)]/10 text-right">
                 {stats.student_id ? (
                   <Link href={`/attendance/student/${stats.student_id}`} className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] hover:underline">
                     View Full Attendance &rarr;
                   </Link>
                 ) : (
                   <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                     No History Available
                   </span>
                 )}
              </div>
            </div>
          )}
        </div>

        {/* AI ASSISTANT */}
        <div>
          <h2 className="text-lg font-semibold tracking-tight uppercase text-[var(--muted-foreground)] mb-6">AI Student Assistant</h2>
          <div className="bg-[var(--foreground)] text-[var(--background)] rounded-lg overflow-hidden flex flex-col h-full shadow-md">
            <div className="p-8 flex-1">
              <h3 className="text-2xl font-bold tracking-tight mb-2">Have a question?</h3>
              <p className="text-sm text-[var(--muted)] opacity-90 mb-6">
                Ask your AI learning assistant about:
              </p>
              <ul className="space-y-2 text-sm font-medium mb-8 opacity-90">
                <li className="flex items-center gap-2">&bull; Science</li>
                <li className="flex items-center gap-2">&bull; Mathematics</li>
                <li className="flex items-center gap-2">&bull; Programming</li>
                <li className="flex items-center gap-2">&bull; General concepts</li>
              </ul>
              
              <div className="bg-white/10 rounded-md p-4 mb-6">
                <p className="text-xs uppercase tracking-widest opacity-70 mb-1">Example Prompt</p>
                <p className="text-sm font-mono italic">&quot;Explain photosynthesis in simple words.&quot;</p>
              </div>

              <Link href="/ai">
                <Button variant="secondary" className="w-full h-12 font-bold tracking-wider uppercase bg-[var(--background)] text-[var(--foreground)] hover:bg-[var(--muted)]">
                  Ask AI Assistant
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS & AI HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
        
        {/* QUICK ACTIONS */}
        <div>
          <h2 className="text-sm font-semibold tracking-tight uppercase text-[var(--muted-foreground)] mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/ai">
              <Button variant="outline" className="h-10 px-4 font-semibold text-xs tracking-wider uppercase border-2">
                Ask AI Assistant
              </Button>
            </Link>
            {stats.student_id && (
              <Link href={`/attendance/student/${stats.student_id}`}>
                <Button variant="outline" className="h-10 px-4 font-semibold text-xs tracking-wider uppercase border-2">
                  View Attendance
                </Button>
              </Link>
            )}
            <Link href="/student#my-class">
              <Button variant="outline" className="h-10 px-4 font-semibold text-xs tracking-wider uppercase border-2">
                My Class
              </Button>
            </Link>
          </div>
        </div>

        {/* RECENT AI CONVERSATIONS */}
        <div>
          <h2 className="text-sm font-semibold tracking-tight uppercase text-[var(--muted-foreground)] mb-4">Recent AI Conversations</h2>
          {conversations.length === 0 ? (
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg p-6">
              <p className="text-sm font-medium text-[var(--foreground)] mb-1">Start learning with AI</p>
              <p className="text-xs text-[var(--muted-foreground)] mb-4">Ask your first question.</p>
              <Link href="/ai">
                <Button variant="outline" size="sm" className="text-xs font-bold uppercase tracking-wider">
                  Open AI Assistant
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-[var(--background)] border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="divide-y divide-[var(--border)]">
                {conversations.map((conv) => {
                   const date = new Date(conv.created_at);
                   const isToday = date.toDateString() === new Date().toDateString();
                   const yesterday = new Date();
                   yesterday.setDate(yesterday.getDate() - 1);
                   const isYesterday = date.toDateString() === yesterday.toDateString();
                   const dateStr = isToday ? "Today" : isYesterday ? "Yesterday" : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                   return (
                    <div key={conv.id} className="flex justify-between items-center p-4 hover:bg-[var(--muted)]/20 transition-colors">
                      <span className="text-sm font-medium text-[var(--foreground)] truncate pr-4">
                        {conv.title || "Untitled Conversation"}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">
                        {dateStr}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--muted)]/10 text-right">
                 <Link href="/ai" className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] hover:underline">
                   Open AI Assistant &rarr;
                 </Link>
              </div>
            </div>
          )}
        </div>

      </div>
      
    </div>
  );
}
