"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface School {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
  school_id: string;
}

export default function NewClassPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  const [formData, setFormData] = useState({
    grade: "",
    section: "",
    name: "",
    status: "ACTIVE",
    school_id: "",
    teacher_id: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "TEACHER" || user?.role === "STUDENT") {
      router.replace("/");
      return;
    }

    const fetchData = async () => {
      try {
        if (user?.role === "SUPER_ADMIN") {
          const res = await apiClient.get("/schools");
          const data = await res.json();
          setSchools(data);
        } else if (user?.role === "SCHOOL_ADMIN") {
          const res = await apiClient.get("/teachers");
          const data = await res.json();
          setTeachers(data.items || []);
        }
      } catch (err) {
        console.error("Failed to fetch initial data", err);
      }
    };
    fetchData();
  }, [user, router]);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN" && formData.school_id) {
      const fetchTeachersForSchool = async () => {
        try {
          const res = await apiClient.get(`/teachers?school_id=${formData.school_id}`);
          const data = await res.json();
          setTeachers(data.items || []);
        } catch (err) {
          console.error("Failed to fetch teachers for school", err);
        }
      };
      fetchTeachersForSchool();
    }
  }, [formData.school_id, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { ...formData };
      if (!payload.section) delete payload.section;
      if (!payload.name) delete payload.name;
      if (!payload.teacher_id) delete payload.teacher_id;
      
      if (user?.role === "SCHOOL_ADMIN") {
        delete payload.school_id;
      }

      let url = "/classes/";
      if (user?.role === "SUPER_ADMIN") {
        if (!payload.school_id) throw new Error("School must be selected");
        url = `/classes/?school_id=${payload.school_id}`;
        delete payload.school_id;
      }

      const response = await apiClient.post(url, payload);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to create class");
      }
      
      router.push("/classes");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role === "TEACHER" || user?.role === "STUDENT") {
    return <ErrorState title="Unauthorized" description="You do not have permission to access this page." />;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/classes" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          &larr; Back to Classes
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Create New Class</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Add a new class or section to the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Class Details</CardTitle>
          <CardDescription>Enter the primary information for the new class.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-6 rounded-md bg-[var(--destructive)]/10 p-4 text-sm text-[var(--destructive)] font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Class Name</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. 10th Grade Section A"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  Grade <span className="text-[var(--destructive)]">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={formData.grade}
                  onChange={(e) => setFormData({...formData, grade: e.target.value})}
                  placeholder="e.g. 10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Section</label>
                <Input
                  type="text"
                  value={formData.section}
                  onChange={(e) => setFormData({...formData, section: e.target.value})}
                  placeholder="e.g. A"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Status</label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </Select>
              </div>

              {user?.role === "SUPER_ADMIN" && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">
                    School <span className="text-[var(--destructive)]">*</span>
                  </label>
                  <Select
                    required
                    value={formData.school_id}
                    onChange={(e) => {
                      setFormData({...formData, school_id: e.target.value, teacher_id: ""});
                    }}
                  >
                    <option value="">Select a school</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                </div>
              )}

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Assign Teacher</label>
                <Select
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                  disabled={user?.role === "SUPER_ADMIN" && !formData.school_id}
                >
                  <option value="">No teacher assigned</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </Select>
                {user?.role === "SUPER_ADMIN" && !formData.school_id && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">Select a school first to assign a teacher.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/classes">
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Creating..." : "Create Class"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
