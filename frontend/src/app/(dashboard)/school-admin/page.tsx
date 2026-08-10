"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function SchoolAdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Welcome back, {user?.email}. Here&apos;s what&apos;s happening across your school today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manage</div>
            <Link href="/teachers" className="text-sm text-[var(--foreground)] hover:underline mt-1 inline-block">View all teachers →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manage</div>
            <Link href="/classes" className="text-sm text-[var(--foreground)] hover:underline mt-1 inline-block">View all classes →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manage</div>
            <Link href="/students" className="text-sm text-[var(--foreground)] hover:underline mt-1 inline-block">View all students →</Link>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/teachers/new"><Button variant="secondary" className="w-full justify-start">Add New Teacher</Button></Link>
            <Link href="/classes/new"><Button variant="secondary" className="w-full justify-start">Create New Class</Button></Link>
            <Link href="/students/new"><Button variant="secondary" className="w-full justify-start">Add New Student</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
