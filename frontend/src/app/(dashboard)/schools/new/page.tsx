"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorState } from "@/components/ui/ErrorState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function NewSchoolPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user?.role !== "SUPER_ADMIN") {
    return <ErrorState title="Unauthorized" description="You do not have permission to access this page." />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post("/schools", {
        name,
        address: address || null,
        contact_email: contactEmail || null,
        status: "ACTIVE"
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to create school");
      }

      router.push("/schools");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Link href="/schools" className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          &larr; Back to Schools
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Create New School</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Add a new educational institution to the system.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Details</CardTitle>
          <CardDescription>Enter the primary information for the new school.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="mb-6 rounded-md bg-[var(--destructive)]/10 p-4 text-sm text-[var(--destructive)] font-medium">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">School Name</label>
                <Input
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lincoln High School"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Address</label>
                <Input
                  type="text"
                  maxLength={255}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 123 Education Lane, City, State"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Contact Email</label>
                <Input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. contact@lincolnhigh.edu"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link href="/schools">
                <Button variant="ghost" type="button">Cancel</Button>
              </Link>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Creating..." : "Create School"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
