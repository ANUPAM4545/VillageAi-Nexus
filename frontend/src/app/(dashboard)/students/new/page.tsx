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

export default function NewStudentPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [schools, setSchools] = useState<{id: string, name: string}[]>([]);

  const [formData, setFormData] = useState({
    student_id: "",
    name: "",
    grade: "",
    section: "",
    parent_name: "",
    parent_phone: "",
    school_id: "" // For Super Admin
  });

  useEffect(() => {
    if (user?.role !== "SUPER_ADMIN" && user?.role !== "SCHOOL_ADMIN") {
      router.replace("/students");
      return;
    }

    if (user?.role === "SUPER_ADMIN") {
      apiClient.get("/schools").then(async res => {
        if (res.ok) setSchools(await res.json());
      });
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (user?.role === "SUPER_ADMIN" && !formData.school_id) {
        throw new Error("Super Admin must explicitly select a school");
      }

      const queryParam = formData.school_id ? `?school_id=${formData.school_id}` : "";
      
      const payload = {
        student_id: formData.student_id,
        name: formData.name,
        grade: formData.grade,
        section: formData.section || null,
        parent_name: formData.parent_name || null,
        parent_phone: formData.parent_phone || null,
        status: "ACTIVE"
      };

      const response = await apiClient.post(`/students${queryParam}`, payload);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to create student");
      }

      router.push("/students");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (user?.role !== "SUPER_ADMIN" && user?.role !== "SCHOOL_ADMIN") {
    return <ErrorState title="Unauthorized" description="You do not have permission to access this page." />;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/students" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          &larr; Back to Students
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Create New Student</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Add a new student to the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Details</CardTitle>
          <CardDescription>Enter the academic and personal information for the new student.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-6 rounded-md bg-[var(--destructive)]/10 p-4 text-sm text-[var(--destructive)] font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {user?.role === "SUPER_ADMIN" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  Target School <span className="text-[var(--destructive)]">*</span>
                </label>
                <Select
                  name="school_id"
                  value={formData.school_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select a School --</option>
                  {schools.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  Student ID <span className="text-[var(--destructive)]">*</span>
                </label>
                <Input
                  type="text"
                  name="student_id"
                  required
                  value={formData.student_id}
                  onChange={handleChange}
                  placeholder="e.g. STU-2023-001"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  Full Name <span className="text-[var(--destructive)]">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  Grade <span className="text-[var(--destructive)]">*</span>
                </label>
                <Input
                  type="text"
                  name="grade"
                  required
                  value={formData.grade}
                  onChange={handleChange}
                  placeholder="e.g. 10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Section</label>
                <Input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="e.g. A"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Parent Name</label>
                <Input
                  type="text"
                  name="parent_name"
                  value={formData.parent_name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Parent Phone</label>
                <Input
                  type="text"
                  name="parent_phone"
                  value={formData.parent_phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/students">
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Creating..." : "Create Student"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
