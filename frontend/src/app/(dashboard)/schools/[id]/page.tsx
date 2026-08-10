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

interface School {
  id: string;
  name: string;
  address: string | null;
  contact_email: string | null;
  status: string;
  created_at: string;
}

interface SchoolStats {
  school_admin_count: number;
  teacher_count: number;
  student_count: number;
}

export default function SchoolDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  
  const [school, setSchool] = useState<School | null>(null);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    contact_email: "",
    status: "ACTIVE"
  });

  const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "SCHOOL_ADMIN";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [schoolRes, statsRes] = await Promise.all([
          apiClient.get(`/schools/${id}`),
          apiClient.get(`/schools/${id}/statistics`)
        ]);

        if (!schoolRes.ok) {
          if (schoolRes.status === 404 || schoolRes.status === 403) {
            router.replace("/schools");
            return;
          }
          throw new Error("Failed to fetch school details");
        }
        
        const schoolData = await schoolRes.json();
        setSchool(schoolData);
        setFormData({
          name: schoolData.name,
          address: schoolData.address || "",
          contact_email: schoolData.contact_email || "",
          status: schoolData.status
        });

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchData();
  }, [id, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    try {
      const response = await apiClient.patch(`/schools/${id}`, {
        name: formData.name,
        address: formData.address || null,
        contact_email: formData.contact_email || null,
        status: formData.status
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update school");
      }

      setSchool(await response.json());
      setSuccess("School updated successfully!");
      setIsEditing(false);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  };

  if (loading) return <Loading />;
  if (!school) return <ErrorState title="School not found" description="The school you are looking for does not exist." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {user?.role === "SUPER_ADMIN" && (
              <Link href="/schools" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                &larr; Back
              </Link>
            )}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--foreground)]">{school.name}</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Manage school details and view statistics.
          </p>
        </div>
        {canEdit && !isEditing && (
          <Button variant="secondary" onClick={() => setIsEditing(true)}>
            Edit School
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>Primary details and settings for this school.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-4 rounded-md bg-[var(--destructive)]/10 p-4 text-sm text-[var(--destructive)]">{error}</div>}
          {success && <div className="mb-4 rounded-md bg-[var(--success)]/10 p-4 text-sm text-[var(--success)]">{success}</div>}

          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Name</label>
                  <Input
                    type="text" required maxLength={100}
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Status</label>
                  <Select
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Address</label>
                  <Input
                    type="text" maxLength={255}
                    value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Contact Email</label>
                  <Input
                    type="email"
                    value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Save Changes</Button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">School Name</dt>
                <dd className="text-sm text-[var(--foreground)]">{school.name}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Status</dt>
                <dd>
                  <Badge variant={school.status === "ACTIVE" ? "default" : "secondary"}>
                    {school.status}
                  </Badge>
                </dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Address</dt>
                <dd className="text-sm text-[var(--foreground)]">{school.address || "—"}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-sm font-medium text-[var(--muted-foreground)]">Contact Email</dt>
                <dd className="text-sm text-[var(--foreground)]">{school.contact_email || "—"}</dd>
              </div>
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
          <CardDescription>Current user counts for this school.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm font-medium text-[var(--muted-foreground)] truncate">School Admins</div>
              <div className="mt-1 text-3xl font-bold text-[var(--foreground)]">{stats?.school_admin_count ?? 0}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm font-medium text-[var(--muted-foreground)] truncate">Teachers</div>
              <div className="mt-1 text-3xl font-bold text-[var(--foreground)]">{stats?.teacher_count ?? 0}</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="text-sm font-medium text-[var(--muted-foreground)] truncate">Students</div>
              <div className="mt-1 text-3xl font-bold text-[var(--foreground)]">{stats?.student_count ?? 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
