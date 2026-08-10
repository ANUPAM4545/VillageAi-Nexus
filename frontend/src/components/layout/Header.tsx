"use client"

import { useAuth } from "@/components/providers/auth-provider"

export function Header() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-[var(--border)] bg-[var(--background)] px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end items-center">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-[var(--foreground)]">{user.email}</span>
            <span className="text-xs text-[var(--muted-foreground)] capitalize">{user.role.replace("_", " ").toLowerCase()}</span>
          </div>
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-[var(--border)]" aria-hidden="true" />
          <button
            onClick={logout}
            className="text-sm font-semibold leading-6 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
