"use client"

import * as React from "react"
import { AlertTriangleIcon, InboxIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * The data states every surface needs, promoted from PBJ Chalet (UX Designer Decisions (49)).
 * Loading is the package's `Skeleton`, shaped like the real content so nothing reflows when
 * the data lands; these are the other three.
 */

/** Empty says why, and offers the way out. "No results" is a dead end. */
function Empty({ title, detail, action, className }: {
  title: string
  detail?: string
  action?: { label: string; onClick: () => void }
  className?: string
}) {
  return (
    <div data-slot="empty" className={cn("flex flex-col items-start gap-2 p-6", className)}>
      <InboxIcon className="size-5 text-muted-foreground" />
      <div className="text-sm font-medium">{title}</div>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      {action && (
        <Button variant="outline" size="sm" className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

/** Error reassures first, then recovers. */
function Failed({ what, message, onRetry, className }: {
  what: string
  message?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div data-slot="failed" role="alert"
         className={cn("flex flex-col items-start gap-2 rounded-xl p-6 ring-1 ring-destructive/40", className)}>
      <AlertTriangleIcon className="size-5 text-destructive" />
      <div className="text-sm font-medium">{what} did not load</div>
      <p className="text-xs text-muted-foreground">
        Nothing has changed on your side.{message ? ` ${message}` : ""}
      </p>
      {onRetry && (
        <Button size="sm" className="mt-2" onClick={onRetry}>Retry</Button>
      )}
    </div>
  )
}

/** Partial names the gap rather than hiding it. */
function Partial({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div data-slot="partial"
         className={cn("flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs ring-1 ring-inset ring-border-strong",
                       className)}>
      {children}
    </div>
  )
}

export { Empty, Failed, Partial }
