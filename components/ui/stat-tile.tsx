"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * One stat tile for every app, taken from PBJ Chalet's MetricTile (UX Designer Decisions (50)).
 * The tile is told what to show, not how to compute it: the change and its direction come in
 * as values, because "better" depends on the figure (a lower cost is better, a lower income
 * is not) and only the app knows which.
 *
 * The whole tile is one link or button (Standards § Data display): it leads to the rows
 * behind the figure.
 */
type StatTileComparison = {
  /** The earlier figure, already formatted. */
  was: React.ReactNode
  /** The change, already formatted ("+12%", "−3 pts"), and whether it is good news. */
  change?: { text: string; tone: "better" | "worse" | "same" }
  /** What it is compared against, a short label ("2025 · same point"). */
  against: React.ReactNode
}

type StatTileProps = {
  label: React.ReactNode
  /** For a figure that is not final ("reserved", "estimate"): never shown as authoritatively
   *  as a realised one. */
  badge?: string
  /** The figure, already formatted; null shows a dash. */
  value: React.ReactNode | null
  unit?: string
  sub?: React.ReactNode
  /** Leave out for no footer. `null` keeps the footer and says there is nothing to compare,
   *  so a row of tiles stays level when one of them has no earlier figure. */
  comparison?: StatTileComparison | null
  href?: string
  onClick?: () => void
  className?: string
}

const TONE = { better: "text-positive", worse: "text-destructive", same: "text-muted-foreground" }

function StatTile({ label, badge, value, unit, sub, comparison, href, onClick, className }: StatTileProps) {
  const body = (
    <>
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {label}
        {badge && (
          <span className="rounded px-1.5 py-px text-[10px] tracking-wide uppercase ring-1 ring-inset ring-foreground/25">
            {badge}
          </span>
        )}
      </span>
      <span className="block text-2xl font-semibold tracking-tight tabular-nums">
        {value === null ? "—" : value}
        {value !== null && unit && (
          <span className="ml-1 text-sm font-normal tracking-normal text-muted-foreground">{unit}</span>
        )}
      </span>
      {sub && <span className="mt-0.5 block text-xs text-muted-foreground">{sub}</span>}
      {comparison !== undefined && (
        <span className="mt-3 block border-t border-border pt-2.5">
          <span className="flex items-baseline gap-2.5 tabular-nums">
            {comparison === null ? (
              <span className="text-xs text-muted-foreground">nothing to compare</span>
            ) : (
              <>
                <span className="text-base font-medium text-foreground/80">{comparison.was}</span>
                {comparison.change && (
                  <span className={cn("text-[13px]", TONE[comparison.change.tone])}>{comparison.change.text}</span>
                )}
              </>
            )}
          </span>
          {comparison && (
            <span className="mt-0.5 block text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              {comparison.against}
            </span>
          )}
        </span>
      )}
    </>
  )
  const cls = cn(
    "flex h-full flex-col rounded-xl bg-card p-4 text-left text-card-foreground ring-1 ring-foreground/10",
    (href || onClick) && "cursor-pointer transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className,
  )
  if (href) return <a data-slot="stat-tile" href={href} onClick={onClick} className={cls}>{body}</a>
  if (onClick) return <button data-slot="stat-tile" type="button" onClick={onClick} className={cls}>{body}</button>
  return <div data-slot="stat-tile" className={cls}>{body}</div>
}

export { StatTile }
export type { StatTileProps, StatTileComparison }
