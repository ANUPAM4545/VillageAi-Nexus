"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { cn } from "@/lib/utils"

interface NavItem {
  name: string
  href: string
}

export function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const navigation: NavItem[] = [{ name: "Dashboard", href: "/" }]

  if (user.role === "SUPER_ADMIN") {
    navigation.push(
      { name: "Schools", href: "/schools" },
      { name: "Students", href: "/students" },
      { name: "Teachers", href: "/teachers" },
      { name: "Classes", href: "/classes" }
    )
  } else if (user.role === "SCHOOL_ADMIN") {
    navigation.push(
      { name: "Students", href: "/students" },
      { name: "Teachers", href: "/teachers" },
      { name: "Classes", href: "/classes" }
    )
  } else if (user.role === "TEACHER") {
    navigation.push(
      { name: "My Profile", href: "/teachers" },
      { name: "My Classes", href: "/classes" }
    )
  } else if (user.role === "STUDENT") {
    navigation.push(
      { name: "My Classes", href: "/classes" }
    )
  }

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
