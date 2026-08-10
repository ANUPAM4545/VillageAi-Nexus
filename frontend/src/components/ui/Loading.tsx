import * as React from "react"
import { cn } from "@/lib/utils"

export function Loading({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 space-y-4", className)}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--muted)] border-t-[var(--primary)]" />
      <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
    </div>
  )
}
