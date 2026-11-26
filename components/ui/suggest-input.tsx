"use client"

import * as React from "react"
import { Autocomplete } from "@base-ui/react/autocomplete"

import { cn } from "@/lib/utils"

/**
 * A text field that suggests (UX Designer Decisions (67)): what is typed IS the value, and
 * matching suggestions show under the field as you type, grouped, each with an optional
 * quiet hint. Picking one fills the field; ignoring them keeps the text. Arrow keys move
 * through them, Enter picks the highlighted one, Escape closes the list.
 *
 * Distinct from Combobox, which picks from a list (a vendor, a category): there the field is
 * a button and typed text is only a search. Use this for free text with memory, such as a
 * description. Built on base-ui's Autocomplete; the list is portalled, so it isn't clipped
 * inside a scrolling dialog.
 */
type Suggestion = {
  /** The text the field takes when picked. */
  text: string
  /** Shown as a heading over its suggestions. */
  group?: string
  /** A quiet note at the end of the row ("Sep 2026", "Repairs"). */
  hint?: string
}

type SuggestInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "defaultValue"> & {
  value: string
  onValueChange: (value: string) => void
  suggestions: Suggestion[]
}

type Group = { value: string; items: Suggestion[] }

/** The typed text inside a suggestion, never letters scattered across it; case-blind. */
const contains = (s: Suggestion, query: string) => s.text.toLowerCase().includes(query.trim().toLowerCase())

function SuggestInput({ value, onValueChange, suggestions, className, ...props }: SuggestInputProps) {
  const groups = React.useMemo(() => {
    const m = new Map<string, Suggestion[]>()
    for (const s of suggestions) m.set(s.group ?? "", [...(m.get(s.group ?? "") ?? []), s])
    return [...m.entries()].map(([g, items]): Group => ({ value: g, items }))
  }, [suggestions])

  return (
    <Autocomplete.Root items={groups} value={value} onValueChange={(v) => onValueChange(v)}
                       itemToStringValue={(s: Suggestion) => s.text} filter={contains} openOnInputClick>
      <Autocomplete.Input
        data-slot="suggest-input"
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none",
          "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
          className,
        )}
        {...props}
      />
      <Autocomplete.Portal>
        {/* No list when nothing matches: the field is just a field then. */}
        <Autocomplete.Positioner sideOffset={4} align="start" className="isolate z-50 data-[empty]:hidden">
          <Autocomplete.Popup className={cn(
            "max-h-[min(18rem,var(--available-height))] w-(--anchor-width) min-w-64 overflow-y-auto rounded-xl",
            "bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none",
          )}>
            <Autocomplete.List>
              {(group: Group) => (
                <Autocomplete.Group key={group.value || "_"} items={group.items}>
                  {group.value && (
                    <Autocomplete.GroupLabel className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                      {group.value}
                    </Autocomplete.GroupLabel>
                  )}
                  <Autocomplete.Collection>
                    {(s: Suggestion) => (
                      <Autocomplete.Item key={s.text} value={s} className={cn(
                        "flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm outline-none select-none",
                        "data-[highlighted]:bg-accent max-[479px]:h-11 max-[479px]:text-[15px]",
                      )}>
                        <span className="min-w-0 flex-1 truncate">{s.text}</span>
                        {s.hint && <span className="shrink-0 text-xs text-muted-foreground">{s.hint}</span>}
                      </Autocomplete.Item>
                    )}
                  </Autocomplete.Collection>
                </Autocomplete.Group>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  )
}

export { SuggestInput }
export type { Suggestion, SuggestInputProps }
