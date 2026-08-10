"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Dashboard</h1>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          Welcome back, {user?.email}. Have a great day of teaching!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">My Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">View</div>
            <Link href="/classes" className="text-sm text-[var(--foreground)] hover:underline mt-1 inline-block">See your assigned classes →</Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[var(--muted-foreground)]">Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Directory</div>
            <Link href="/students" className="text-sm text-[var(--foreground)] hover:underline mt-1 inline-block">View school students →</Link>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Useful resources</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/teachers"><Button variant="secondary" className="w-full justify-start">View My Profile</Button></Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
