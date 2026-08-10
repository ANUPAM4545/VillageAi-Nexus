"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface Class {
  id: string;
  grade: string;
  section: string | null;
  name: string | null;
  status: string;
  school_id: string;
  teacher_id: string | null;
}

interface Teacher {
  id: string;
  name: string;
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  
  const [cls, setCls] = useState<Class | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Class>>({});

  useEffect(() => {
    if (user?.role === "STUDENT") {
      router.replace("/");
      return;
    }

    const fetchData = async () => {
      try {
        const response = await apiClient.get(`/classes/${id}`);
        if (!response.ok) {
          if (response.status === 404 || response.status === 403) {
            throw new Error("Class not found or access denied");
          }
          throw new Error("Failed to fetch class details");
        }
        const data = await response.json();
        setCls(data);
        setFormData(data);

        // Fetch teachers for this school for dropdown
        if (user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN") {
          const tRes = await apiClient.get(`/teachers?school_id=${data.school_id}`);
          if (tRes.ok) {
            const tData = await tRes.json();
            setTeachers(tData.items || []);
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, router, id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role === "TEACHER") return; // Teachers cannot edit classes

    try {
      setLoading(true);
      const payload = {
        grade: formData.grade,
        section: formData.section || null,
        name: formData.name || null,
        status: formData.status,
        teacher_id: formData.teacher_id || null,
      };
      const response = await apiClient.patch(`/classes/${id}`, payload);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update class");
      }
      const updatedData = await response.json();
      setCls(updatedData);
      setIsEditing(false);
      setError("");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error && !cls) return <ErrorState title="Error" description={error} />;
  if (!cls) return <ErrorState title="Not Found" description="Class not found." />;

  const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN";
  const assignedTeacher = teachers.find(t => t.id === cls.teacher_id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/classes" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              &larr; Back to Classes
            </Link>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">Class Details</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Information and settings for this class.
          </p>
        </div>
        {canEdit && !isEditing && (
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Edit Class
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>View and manage class information.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-md bg-[var(--destructive)]/10 p-4 text-sm text-[var(--destructive)] font-medium">{error}</div>}

          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Class Name</label>
                  <Input
                    type="text"
                    value={formData.name || ""}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Grade <span className="text-[var(--destructive)]">*</span></label>
                  <Input
                    type="text"
                    required
                    value={formData.grade || ""}
                    onChange={e => setFormData({...formData, grade: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Section</label>
                  <Input
                    type="text"
                    value={formData.section || ""}
                    onChange={e => setFormData({...formData, section: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Status</label>
                  <Select
                    value={formData.status || "ACTIVE"}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Assign Teacher</label>
                  <Select
                    value={formData.teacher_id || ""}
                    onChange={e => setFormData({...formData, teacher_id: e.target.value})}
                  >
                    <option value="">No teacher assigned</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(cls);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="md:col-span-2 space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Class Name</dt>
                <dd className="text-sm font-medium text-[var(--foreground)]">{cls.name || "Untitled Class"}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Grade</dt>
                <dd className="text-sm text-[var(--foreground)]">{cls.grade}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Section</dt>
                <dd className="text-sm text-[var(--foreground)]">{cls.section || "—"}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Assigned Teacher</dt>
                <dd className="text-sm text-[var(--foreground)]">
                  {assignedTeacher ? assignedTeacher.name : "Unassigned"}
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Status</dt>
                <dd>
                  <Badge variant={cls.status === "ACTIVE" ? "default" : "secondary"}>
                    {cls.status}
                  </Badge>
                </dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
