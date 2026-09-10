"use client"

import * as React from "react"
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group"
import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"

import { cn } from "@/lib/utils"

/**
 * A segmented control: pick one of a few mutually exclusive options that changes what
 * is shown, without the option list leaving the screen.
 *
 * **Not Tabs.** Tabs label panels and carry `tablist`/`tabpanel` semantics; a segmented
 * control is a single-select group with no panel to point at. Consuming apps reached
 * for Tabs because it was the closest thing that shipped, which meant a screen reader
 * was told there were tab panels that did not exist. Two of PBJ Chalet's three Tabs
 * uses were this, found 2026-09-09.
 *
 * `value`/`onValueChange` are single values here, not arrays: base-ui's ToggleGroup is
 * multi-select underneath and this narrows it, so a caller cannot accidentally build a
 * control with two segments lit.
 */
function SegmentedControl({
  className, value, onValueChange, ...props
}: Omit<ToggleGroupPrimitive.Props, "value" | "onValueChange" | "multiple"> & {
  value?: string
  onValueChange?: (value: string) => void
}) {
  return (
    <ToggleGroupPrimitive
      data-slot="segmented-control"
      multiple={false}
      value={value === undefined ? undefined : [value]}
      onValueChange={(next) => {
        // An empty array is the user pressing the lit segment again. A segmented
        // control always has exactly one selection, so that is a no-op, not a clear.
        if (next.length > 0 && onValueChange) onValueChange(String(next[0]))
      }}
      className={cn(
        "inline-flex h-8 w-fit items-center gap-0.5 rounded-lg bg-muted p-0.5",
        className
      )}
      {...props}
    />
  )
}

function SegmentedControlItem({ className, ...props }: TogglePrimitive.Props) {
  return (
    <TogglePrimitive
      data-slot="segmented-control-item"
      className={cn(
        "inline-flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md px-2.5",
        "text-[13px] font-medium whitespace-nowrap text-foreground/60",
        "transition-colors outline-none select-none",
        "hover:text-foreground",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-disabled:pointer-events-none data-disabled:opacity-50",
        "data-pressed:bg-background data-pressed:text-foreground data-pressed:shadow-sm",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
        className
      )}
      {...props}
    />
  )
}

export { SegmentedControl, SegmentedControlItem }
