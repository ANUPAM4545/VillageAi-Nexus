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

export default function NewTeacherPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [schools, setSchools] = useState<School[]>([]);
  
  const [formData, setFormData] = useState({
    teacher_id: "",
    name: "",
    email: "",
    phone: "",
    status: "ACTIVE",
    school_id: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.role === "TEACHER" || user?.role === "STUDENT") {
      router.replace("/");
      return;
    }

    if (user?.role === "SUPER_ADMIN") {
      const fetchSchools = async () => {
        try {
          const res = await apiClient.get("/schools");
          const data = await res.json();
          setSchools(data);
        } catch (err) {
          console.error("Failed to fetch schools", err);
        }
      };
      fetchSchools();
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = { ...formData };
      if (!payload.phone) delete payload.phone;
      if (user?.role === "SCHOOL_ADMIN") {
        delete payload.school_id;
      }

      let url = "/teachers/";
      if (user?.role === "SUPER_ADMIN") {
        if (!payload.school_id) throw new Error("School must be selected");
        url = `/teachers/?school_id=${payload.school_id}`;
        delete payload.school_id;
      }

      const response = await apiClient.post(url, payload);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to create teacher");
      }
      
      router.push("/teachers");
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
        <Link href="/teachers" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          &larr; Back to Teachers
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Create New Teacher</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Add a new teacher to the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Details</CardTitle>
          <CardDescription>Enter the personal and contact information for the new teacher.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-6 rounded-md bg-[var(--destructive)]/10 p-4 text-sm text-[var(--destructive)] font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  Teacher ID <span className="text-[var(--destructive)]">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                  placeholder="e.g. TCH-001"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  Name <span className="text-[var(--destructive)]">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">
                  Email <span className="text-[var(--destructive)]">*</span>
                </label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Phone</label>
                <Input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">
                    School <span className="text-[var(--destructive)]">*</span>
                  </label>
                  <Select
                    required
                    value={formData.school_id}
                    onChange={(e) => setFormData({...formData, school_id: e.target.value})}
                  >
                    <option value="">Select a school</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </Select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/teachers">
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Creating..." : "Create Teacher"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
