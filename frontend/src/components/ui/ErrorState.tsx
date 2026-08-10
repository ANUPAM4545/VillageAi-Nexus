import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"

export interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ title = "Something went wrong", description = "We couldn't load this information.", onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm", className)}>
      <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--muted-foreground)] max-w-sm">{description}</p>
      
      {onRetry && (
        <div className="mt-6">
          <Button variant="secondary" onClick={onRetry}>Try again</Button>
        </div>
      )}
    </div>
  )
}
