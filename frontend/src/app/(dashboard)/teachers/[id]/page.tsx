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

interface Teacher {
  id: string;
  teacher_id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  school_id: string;
  user_id: string | null;
}

export default function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Teacher>>({});

  useEffect(() => {
    if (user?.role === "STUDENT") {
      router.replace("/");
      return;
    }

    const fetchTeacher = async () => {
      try {
        const response = await apiClient.get(`/teachers/${id}`);
        if (!response.ok) {
          if (response.status === 404 || response.status === 403) {
            throw new Error("Teacher not found or access denied");
          }
          throw new Error("Failed to fetch teacher details");
        }
        const data = await response.json();
        setTeacher(data);
        setFormData(data);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTeacher();
  }, [user, router, id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role === "TEACHER") return; // Teachers cannot edit

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        status: formData.status
      };
      const response = await apiClient.patch(`/teachers/${id}`, payload);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update teacher");
      }
      const updatedData = await response.json();
      setTeacher(updatedData);
      setIsEditing(false);
      setError("");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error && !teacher) return <ErrorState title="Error" description={error} />;
  if (!teacher) return <ErrorState title="Not Found" description="Teacher not found." />;

  const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/teachers" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              &larr; Back to Teachers
            </Link>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">Teacher Profile</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Information and settings for {teacher.name}.
          </p>
        </div>
        {canEdit && !isEditing && (
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>View and manage teacher information.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-md bg-[var(--destructive)]/10 p-4 text-sm text-[var(--destructive)] font-medium">{error}</div>}

          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Name</label>
                  <Input
                    type="text"
                    required
                    value={formData.name || ""}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Email</label>
                  <Input
                    type="email"
                    required
                    value={formData.email || ""}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Phone</label>
                  <Input
                    type="text"
                    value={formData.phone || ""}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
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
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(teacher);
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
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Teacher ID</dt>
                <dd className="text-sm font-mono text-[var(--foreground)]">{teacher.teacher_id}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Name</dt>
                <dd className="text-sm font-medium text-[var(--foreground)]">{teacher.name}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Email</dt>
                <dd className="text-sm text-[var(--foreground)]">{teacher.email}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Phone</dt>
                <dd className="text-sm text-[var(--foreground)]">{teacher.phone || "—"}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Status</dt>
                <dd>
                  <Badge variant={teacher.status === "ACTIVE" ? "default" : "secondary"}>
                    {teacher.status}
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
