"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiClient.post("/auth/login", { email, password });
      if (!response.ok) {
        throw new Error("Invalid credentials");
      }
      
      const meResponse = await apiClient.get("/auth/me");
      if (!meResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }
      
      const userData = await meResponse.json();
      login(userData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "An error occurred during login.");
      } else {
        setError("An error occurred during login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            Village AI <span className="font-light text-[var(--muted-foreground)]">NEXUS</span>
          </h1>
          <h2 className="mt-8 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Welcome back.
          </h2>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">
            Sign in to continue.
          </p>
        </div>

        <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-[var(--destructive)]/10 p-3 text-sm text-[var(--destructive)] text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Email</label>
              <Input
                type="email"
                required
                placeholder="super_admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Password</label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
