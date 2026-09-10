"use client"

import * as React from "react"
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group"
import { Radio as RadioPrimitive } from "@base-ui/react/radio"

import { cn } from "@/lib/utils"

/**
 * Single-select from a set of mutually exclusive options, where the options stay on
 * screen. base-ui already shipped `radio-group` and `radio`; this wraps them.
 *
 * **Against SegmentedControl**: a segmented control is a compact switch between VIEWS of
 * the same thing, and its options are short words in one strip. A radio group is a
 * CHOICE among values — it can carry a description per option, wrap over several lines,
 * and its items can render arbitrary content rather than a label.
 *
 * `RadioGroupItem` is the standard dot. For a group whose options are pictures rather
 * than words — colour swatches, layout thumbnails — use `RadioGroupCard`, which takes
 * over the whole option as the hit target and marks selection with a ring instead of a
 * dot. That case is why this exists: a swatch drawn as a `<button>` loses the group's
 * roving focus and the arrow-key navigation a radio group gives for free.
 */
function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  )
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "size-4 shrink-0 rounded-full border border-border-strong bg-background",
        "transition-shadow outline-none",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "data-checked:border-primary data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <RadioPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="flex size-full items-center justify-center"
      >
        <span className="size-1.5 rounded-full bg-primary-foreground" />
      </RadioPrimitive.Indicator>
    </RadioPrimitive.Root>
  )
}

/**
 * A radio whose option IS the content — a swatch, a thumbnail, a preview. Selection is
 * a ring around the option rather than a dot beside it, because the thing being chosen
 * is what the control has to show.
 */
function RadioGroupCard({ className, children, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-card"
      className={cn(
        "flex cursor-pointer items-center justify-center rounded-lg ring-inset",
        "ring-1 ring-border-strong transition-shadow outline-none",
        "hover:ring-foreground/30",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "data-checked:ring-2 data-checked:ring-primary",
        className
      )}
      {...props}
    >
      {children}
    </RadioPrimitive.Root>
  )
}

export { RadioGroup, RadioGroupItem, RadioGroupCard }
