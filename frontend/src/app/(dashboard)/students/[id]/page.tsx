"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

interface Student {
  id: string;
  student_id: string;
  name: string;
  grade: string;
  section: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  status: string;
  school_id: string;
  user_id: string | null;
}

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    section: "",
    parent_name: "",
    parent_phone: "",
    status: "ACTIVE"
  });

  const fetchStudent = useCallback(async () => {
    // Avoid synchronous setState by using a small timeout or just avoiding it?
    // Actually, setting loading to true inside the async function is fine if we defer it or define it in useEffect.
    try {
      const res = await apiClient.get(`/students/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Student not found");
        if (res.status === 403) throw new Error("You do not have permission to view this student");
        throw new Error("Failed to load student details");
      }
      const data = await res.json();
      setStudent(data);
      setFormData({
        name: data.name,
        grade: data.grade,
        section: data.section || "",
        parent_name: data.parent_name || "",
        parent_phone: data.parent_phone || "",
        status: data.status
      });
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let ignore = false;
    const runFetch = async () => {
      if (!ignore) {
        await fetchStudent();
      }
    };
    runFetch();
    return () => { ignore = true; };
  }, [fetchStudent]);

  const handleSave = async () => {
    setSaveLoading(true);
    setError("");
    try {
      const payload = {
        name: formData.name,
        grade: formData.grade,
        section: formData.section || null,
        parent_name: formData.parent_name || null,
        parent_phone: formData.parent_phone || null,
        status: formData.status
      };
      
      const res = await apiClient.patch(`/students/${id}`, payload);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to update student");
      }
      const updated = await res.json();
      setStudent(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <Loading />;
  if (error && !student) return <ErrorState title="Error" description={error} onRetry={fetchStudent} />;
  if (!student) return null;

  const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/students" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              &larr; Back
            </Link>
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">Student Details</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Information and settings for {student.name}.
          </p>
        </div>
        {canEdit && !isEditing && (
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Edit Student
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>View and manage student information.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-md bg-[var(--destructive)]/10 p-4 text-sm text-[var(--destructive)] font-medium">{error}</div>}

          {isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Full Name</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Status</label>
                  <Select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Grade</label>
                  <Input
                    type="text"
                    value={formData.grade}
                    onChange={e => setFormData({...formData, grade: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Section</label>
                  <Input
                    type="text"
                    value={formData.section}
                    onChange={e => setFormData({...formData, section: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Parent Name</label>
                  <Input
                    type="text"
                    value={formData.parent_name}
                    onChange={e => setFormData({...formData, parent_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Parent Phone</label>
                  <Input
                    type="text"
                    value={formData.parent_phone}
                    onChange={e => setFormData({...formData, parent_phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: student.name,
                      grade: student.grade,
                      section: student.section || "",
                      parent_name: student.parent_name || "",
                      parent_phone: student.parent_phone || "",
                      status: student.status
                    });
                  }}
                  disabled={saveLoading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleSave}
                  disabled={saveLoading}
                >
                  {saveLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Student ID (Immutable)</dt>
                <dd className="text-sm text-[var(--foreground)] font-mono">{student.student_id}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">School ID</dt>
                <dd className="text-sm text-[var(--foreground)] truncate font-mono" title={student.school_id}>{student.school_id}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Full Name</dt>
                <dd className="text-sm font-medium text-[var(--foreground)]">{student.name}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Status</dt>
                <dd>
                  <Badge variant={student.status === "ACTIVE" ? "default" : "secondary"}>
                    {student.status}
                  </Badge>
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Grade</dt>
                <dd className="text-sm text-[var(--foreground)]">{student.grade}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Section</dt>
                <dd className="text-sm text-[var(--foreground)]">{student.section || "—"}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Parent Name</dt>
                <dd className="text-sm text-[var(--foreground)]">{student.parent_name || "—"}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Parent Phone</dt>
                <dd className="text-sm text-[var(--foreground)]">{student.parent_phone || "—"}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
