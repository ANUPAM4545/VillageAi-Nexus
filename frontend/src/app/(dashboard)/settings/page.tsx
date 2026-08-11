"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">System Settings</h1>
          <p className="text-[var(--muted-foreground)] mt-1">
            Manage global platform configurations and preferences.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your current account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-sm font-medium text-[var(--muted-foreground)]">Email Address</span>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-[var(--muted-foreground)]">Role</span>
              <p className="font-medium capitalize">{user?.role?.replace('_', ' ').toLowerCase()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Configuration</CardTitle>
            <CardDescription>Global settings for Village AI Nexus.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[100px] items-center justify-center rounded-md border border-dashed border-[var(--border)] bg-[var(--muted)]/30 text-sm text-[var(--muted-foreground)]">
              Configuration modules coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
