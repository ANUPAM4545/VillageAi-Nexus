"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface NavItem {
  name: string
  href: string
}

function NavSection({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 mb-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider hover:text-[var(--foreground)] transition-colors"
      >
        <span>{title}</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="14" 
          height="14" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={cn("transition-transform duration-200", isOpen ? "rotate-180" : "")}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
      {isOpen && (
        <div className="space-y-1">
          {children}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  // SUPER ADMIN SPECIALIZED SIDEBAR
  if (user.role === "SUPER_ADMIN") {
    const isLinkActive = (href: string) => {
      if (href === "/") {
        return pathname === "/super-admin" || pathname === "/"
      }
      return pathname.startsWith(href)
    }

    const userName = user.email.split('@')[0];
    const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

    return (
      <div className="flex h-full w-64 flex-col bg-[var(--background)] border-r border-[var(--border)]">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-[var(--border)]">
          <Link href="/super-admin" className="flex items-center gap-2 font-bold tracking-tight text-[var(--foreground)]">
            <span className="text-xl">VILLAGE AI</span>
            <span className="text-xl font-light text-[var(--muted-foreground)]">NEXUS</span>
          </Link>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto py-6 px-4">
          <nav className="flex-1 space-y-8">
            
            {/* OVERVIEW SECTION */}
            <NavSection title="Overview">
              <Link
                href="/super-admin"
                className={cn(
                  isLinkActive("/super-admin") 
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold" 
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                Dashboard
              </Link>
            </NavSection>

            {/* MANAGEMENT SECTION */}
            <NavSection title="Management">
              {[
                { name: "Schools", href: "/schools" },
                { name: "Students", href: "/students" },
                { name: "Teachers", href: "/teachers" },
                { name: "Classes", href: "/classes" }
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isLinkActive(item.href)
                      ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </NavSection>

            {/* SYSTEM SECTION */}
            <NavSection title="System">
              <Link
                href="/settings"
                className={cn(
                  isLinkActive("/settings")
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                Settings
              </Link>
            </NavSection>
            
          </nav>
        </div>

        {/* BOTTOM USER AREA */}
        <div className="border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] font-medium">
              {capitalizedName.charAt(0)}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-[var(--foreground)]">
                {capitalizedName}
              </span>
              <span className="truncate text-xs text-[var(--muted-foreground)]">Super Admin</span>
            </div>
            <button
              onClick={() => logout()}
              className="rounded p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // TEACHER SPECIALIZED SIDEBAR
  if (user.role === "TEACHER") {
    const isLinkActive = (href: string) => {
      if (href === "/teacher") {
        return pathname === "/teacher" || pathname === "/"
      }
      return pathname.startsWith(href)
    }

    const userName = user.email.split('@')[0];
    const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

    return (
      <div className="flex h-full w-64 flex-col bg-[var(--background)] border-r border-[var(--border)]">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-[var(--border)]">
          <Link href="/teacher" className="flex items-center gap-2 font-bold tracking-tight text-[var(--foreground)]">
            <span className="text-xl">VILLAGE AI</span>
            <span className="text-xl font-light text-[var(--muted-foreground)]">NEXUS</span>
          </Link>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto py-6 px-4">
          <nav className="flex-1 space-y-8">
            
            {/* OVERVIEW SECTION */}
            <NavSection title="Overview">
              <Link
                href="/teacher"
                className={cn(
                  isLinkActive("/teacher") 
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold" 
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                Dashboard
              </Link>
            </NavSection>

            {/* TEACHING SECTION */}
            <NavSection title="Teaching">
              {[
                { name: "My Classes", href: "/classes" },
                { name: "Attendance", href: "/attendance" }
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isLinkActive(item.href)
                      ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </NavSection>

            {/* ACCOUNT SECTION */}
            <NavSection title="Account">
              <Link
                href="/teachers/me"
                className={cn(
                  isLinkActive("/teachers/me")
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                My Profile
              </Link>
              <Link
                href="/settings"
                className={cn(
                  isLinkActive("/settings")
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                Settings
              </Link>
            </NavSection>
            
          </nav>
        </div>

        {/* BOTTOM USER AREA */}
        <div className="border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] font-medium">
              {capitalizedName.charAt(0)}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-[var(--foreground)]">
                {capitalizedName}
              </span>
              <span className="truncate text-xs text-[var(--muted-foreground)]">Teacher</span>
            </div>
            <button
              onClick={() => logout()}
              className="rounded p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // SCHOOL ADMIN SPECIALIZED SIDEBAR
  if (user.role === "SCHOOL_ADMIN") {
    const isLinkActive = (href: string) => {
      if (href === "/school-admin") {
        return pathname === "/school-admin" || pathname === "/"
      }
      return pathname.startsWith(href)
    }

    const userName = user.email.split('@')[0];
    const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

    return (
      <div className="flex h-full w-64 flex-col bg-[var(--background)] border-r border-[var(--border)]">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-[var(--border)]">
          <Link href="/school-admin" className="flex items-center gap-2 font-bold tracking-tight text-[var(--foreground)]">
            <span className="text-xl">VILLAGE AI</span>
            <span className="text-xl font-light text-[var(--muted-foreground)]">NEXUS</span>
          </Link>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto py-6 px-4">
          <nav className="flex-1 space-y-8">
            
            {/* OVERVIEW SECTION */}
            <NavSection title="Overview">
              <Link
                href="/school-admin"
                className={cn(
                  isLinkActive("/school-admin") 
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold" 
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                Dashboard
              </Link>
            </NavSection>

            {/* MANAGEMENT SECTION */}
            <NavSection title="Management">
              {[
                { name: "Students", href: "/students" },
                { name: "Teachers", href: "/teachers" },
                { name: "Classes", href: "/classes" }
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isLinkActive(item.href)
                      ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </NavSection>

            {/* ATTENDANCE SECTION */}
            <NavSection title="Attendance">
              <Link
                href="/attendance"
                className={cn(
                  isLinkActive("/attendance")
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                Attendance
              </Link>
            </NavSection>

            {/* SCHOOL SECTION */}
            <NavSection title="School">
              <Link
                href={`/schools/${user.school_id}`}
                className={cn(
                  isLinkActive(`/schools/${user.school_id}`)
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                My School
              </Link>
            </NavSection>

            {/* ACCOUNT SECTION */}
            <NavSection title="Account">
              <Link
                href="/settings"
                className={cn(
                  isLinkActive("/settings")
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                Settings
              </Link>
            </NavSection>
            
          </nav>
        </div>

        {/* BOTTOM USER AREA */}
        <div className="border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] font-medium">
              {capitalizedName.charAt(0)}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-[var(--foreground)]">
                {capitalizedName}
              </span>
              <span className="truncate text-xs text-[var(--muted-foreground)]">School Admin</span>
            </div>
            <button
              onClick={() => logout()}
              className="rounded p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // STUDENT SPECIALIZED SIDEBAR
  if (user.role === "STUDENT") {
    const isLinkActive = (href: string) => {
      if (href === "/student") {
        return pathname === "/student" || pathname === "/"
      }
      return pathname.startsWith(href)
    }

    const userName = user.email.split('@')[0];
    const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

    return (
      <div className="flex h-full w-64 flex-col bg-[var(--background)] border-r border-[var(--border)]">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-[var(--border)]">
          <Link href="/student" className="flex items-center gap-2 font-bold tracking-tight text-[var(--foreground)]">
            <span className="text-xl">VILLAGE AI</span>
            <span className="text-xl font-light text-[var(--muted-foreground)]">NEXUS</span>
          </Link>
        </div>
        
        <div className="flex flex-1 flex-col overflow-y-auto py-6 px-4">
          <nav className="flex-1 space-y-8">
            
            {/* OVERVIEW SECTION */}
            <NavSection title="Overview">
              <Link
                href="/student"
                className={cn(
                  isLinkActive("/student") 
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold" 
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                Dashboard
              </Link>
            </NavSection>

            {/* MY SCHOOL SECTION */}
            <NavSection title="My School">
              {/* Note: since there is no safe global class list, My Class points to Dashboard anchor */}
              <Link
                href="/student#my-class"
                className={cn(
                  isLinkActive("/student#my-class")
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                My Class
              </Link>
              <Link
                href="/attendance/student/me"
                className={cn(
                  isLinkActive("/attendance")
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                My Attendance
              </Link>
            </NavSection>

            {/* LEARNING SECTION */}
            <NavSection title="Learning">
              <Link
                href="/ai"
                className={cn(
                  isLinkActive("/ai")
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                AI Assistant
              </Link>
            </NavSection>

            {/* ACCOUNT SECTION */}
            <NavSection title="Account">
              <Link
                href="/settings"
                className={cn(
                  isLinkActive("/settings")
                    ? "bg-[var(--muted)] text-[var(--foreground)] font-semibold"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                Settings
              </Link>
            </NavSection>
            
          </nav>
        </div>

        {/* BOTTOM USER AREA */}
        <div className="border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--muted)] border border-[var(--border)] text-[var(--foreground)] font-medium">
              {capitalizedName.charAt(0)}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-[var(--foreground)]">
                {capitalizedName}
              </span>
              <span className="truncate text-xs text-[var(--muted-foreground)]">Student</span>
            </div>
            <button
              onClick={() => logout()}
              className="rounded p-2 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              title="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- ORIGINAL RENDER LOGIC FOR OTHER ROLES (UNCHANGED) ---
  const navigation: NavItem[] = [{ name: "Dashboard", href: "/" }]

  return (
    <div className="flex h-full w-64 flex-col bg-[var(--background)] border-r border-[var(--border)]">
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-[var(--foreground)]">
          <span className="text-xl">Village AI</span>
          <span className="text-xl font-light text-[var(--muted-foreground)]">NEXUS</span>
        </Link>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto pt-4 pb-4">
        <nav className="flex-1 space-y-1 px-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  isActive
                    ? "bg-[var(--muted)] text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]",
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors"
                )}
              >
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
