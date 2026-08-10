import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"
import Link from "next/link"

export interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  actionOnClick?: () => void
  className?: string
}

export function EmptyState({ title, description, actionLabel, actionHref, actionOnClick, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-12 text-center rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm", className)}>
      <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--muted-foreground)] max-w-sm">{description}</p>
      
      {actionLabel && (
        <div className="mt-6">
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="primary">{actionLabel}</Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={actionOnClick}>{actionLabel}</Button>
          )}
        </div>
      )}
    </div>
  )
}
