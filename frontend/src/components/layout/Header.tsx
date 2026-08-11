"use client"

import { useAuth } from "@/components/providers/auth-provider"

interface HeaderProps {
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Header({ toggleSidebar, isSidebarOpen }: HeaderProps = {}) {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <header className="flex h-16 shrink-0 items-center gap-x-4 border-b border-[var(--border)] bg-[var(--background)] px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {toggleSidebar && (
        <button
          onClick={toggleSidebar}
          className="-m-2.5 p-2.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <span className="sr-only">Toggle sidebar</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      )}
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
