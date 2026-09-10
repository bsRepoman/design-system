"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

/**
 * A wrapper over base-ui's popover, which was already a dependency and unwrapped.
 *
 * The gap it closes is not styling. Consumers were hand-rolling a popover out of a
 * button, a boolean and two document listeners — PBJ Chalet's table filter and column
 * picker did exactly that, and each copy has to re-solve outside-click, Escape, focus
 * return, portalling and collision flipping. That is the primitive's job, and getting
 * it wrong is invisible until someone opens a panel near the bottom of a long table.
 *
 * Distinct from DropdownMenu: a menu is a list of ACTIONS with menu semantics and
 * type-ahead; a popover holds arbitrary content — a filter list, a form, a summary.
 */
const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger

function PopoverContent({
  className,
  children,
  side = "bottom",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        side={side}
        sideOffset={sideOffset}
        align={align}
        alignOffset={alignOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "relative isolate z-50 max-h-(--available-height) min-w-36 origin-(--transform-origin)",
            "overflow-y-auto rounded-xl bg-popover p-1.5 text-popover-foreground",
            "shadow-md ring-1 ring-foreground/10 duration-100 outline-none",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
            "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent }
