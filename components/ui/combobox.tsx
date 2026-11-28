"use client"

import * as React from "react"
import { Command } from "cmdk"
import { CheckIcon, ChevronDownIcon, PlusIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useIsPhone } from "@/hooks/use-phone"
import { cn } from "@/lib/utils"

/**
 * A searchable picker (UX Designer Decisions (51)): type to filter, optional groups, an
 * optional recent section, an optional "Add new" row, an optional free-text row, full
 * keyboard use. A dropdown under the field on a desktop; below 480px a full-height sheet, so
 * the phone keyboard never covers the results.
 *
 * Built on `cmdk` (shadcn's Command pattern). A search matches an option's label, its group
 * and any keywords, so "sno" finds Grounds › Snow removal and "grounds" finds every Grounds
 * subcategory.
 */
type ComboboxOption = {
  value: string
  label: string
  /** Shown as a heading, and matched by the search. */
  group?: string
  /** A quiet note at the end of the row ("Sep 2026", "Repairs"). */
  hint?: string
  keywords?: string[]
}

type ComboboxProps = {
  /** Names the field: the trigger's accessible name and the phone sheet's title. */
  label: string
  options: ComboboxOption[]
  value: string | null
  /** `option` is undefined for free text (`freeText`). */
  onValueChange: (value: string, option?: ComboboxOption) => void
  placeholder?: string
  searchPlaceholder?: string
  /** Values to offer first, under `recentLabel`, while nothing is typed. */
  recent?: string[]
  recentLabel?: string
  /** Shows an "Add …" row for what was typed; the app creates it and then sets the value. */
  onCreate?: (query: string) => void
  createLabel?: (query: string) => string
  /** Lets what was typed be the value itself ("Use as typed"), for a field that suggests
   *  rather than restricts. */
  freeText?: boolean
  /** The text the trigger shows for a free-text value that is not an option. */
  displayValue?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  id?: string
}

function Combobox(props: ComboboxProps) {
  const { label, options, value, placeholder = "Choose…", disabled, className, id, displayValue } = props
  const isPhone = useIsPhone()
  const [open, setOpen] = React.useState(false)
  // The search field takes focus on open, so a phone raises its keyboard at once.
  const inputRef = React.useRef<HTMLInputElement>(null)
  const selected = options.find((o) => o.value === value)
  const shown = selected?.label ?? (value ? displayValue ?? value : null)

  const trigger = (
    <Button
      id={id}
      variant="outline"
      role="combobox"
      aria-expanded={open}
      aria-label={`${label}${shown ? `: ${shown}` : ""}`}
      disabled={disabled}
      className={cn("h-9 w-full justify-between px-3 font-normal max-[479px]:h-11 max-[479px]:text-[15px]", className)}
    >
      <span className={cn("truncate", !shown && "text-muted-foreground")}>
        {selected?.group && <span className="text-muted-foreground">{selected.group} › </span>}
        {shown ?? placeholder}
      </span>
      <ChevronDownIcon className="text-muted-foreground" />
    </Button>
  )

  const close = () => setOpen(false)

  if (isPhone) {
    return (
      <>
        {React.cloneElement(trigger, { onClick: () => setOpen(true) })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" showCloseButton={false} initialFocus={inputRef}
                        className="top-14 gap-0 rounded-t-2xl p-0 data-[side=bottom]:h-auto">
            <div className="mx-auto mt-2 mb-1 h-1 w-9 rounded-full bg-input" aria-hidden />
            <div className="flex items-center gap-2 px-4 pt-1 pb-2">
              <SheetTitle className="flex-1 text-base font-semibold">{label}</SheetTitle>
              <Button variant="ghost" size="sm" onClick={close}>Done</Button>
            </div>
            <Picker {...props} onDone={close} phone inputRef={inputRef} />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="start" initialFocus={inputRef} className="w-(--anchor-width) min-w-64 p-0">
        <Picker {...props} onDone={close} inputRef={inputRef} />
      </PopoverContent>
    </Popover>
  )
}

/** Matches the typed text inside an option's label, group or keywords, never letters
 *  scattered across them: cmdk's default fuzzy scorer kept "Lawn care" for "sno" (measured,
 *  score 0.005), which reads as a broken filter. A prefix ranks first, then a word start,
 *  then anywhere. */
function match(_value: string, search: string, keywords?: string[]) {
  const s = search.trim().toLowerCase()
  if (!s) return 1
  let best = 0
  for (const k of keywords ?? []) {
    const t = k.toLowerCase()
    if (t.startsWith(s)) return 1
    if (t.split(/[\s/›&,-]+/).some((w) => w.startsWith(s))) best = Math.max(best, 0.8)
    else if (t.includes(s)) best = Math.max(best, 0.5)
  }
  return best
}

function Picker({ label, options, value, onValueChange, searchPlaceholder = "Search…", recent = [],
                  recentLabel = "Recent", onCreate, createLabel = (q) => `Add "${q}"`, freeText,
                  emptyText = "Nothing matches.", onDone, phone, inputRef }:
  ComboboxProps & { onDone: () => void; phone?: boolean; inputRef: React.RefObject<HTMLInputElement | null> }) {
  const [query, setQuery] = React.useState("")
  const q = query.trim()
  const pick = (v: string, o?: ComboboxOption) => { onValueChange(v, o); onDone() }
  const byValue = React.useMemo(() => new Map(options.map((o) => [o.value, o])), [options])
  const groups = React.useMemo(() => {
    const m = new Map<string, ComboboxOption[]>()
    for (const o of options) m.set(o.group ?? "", [...(m.get(o.group ?? "") ?? []), o])
    return [...m.entries()]
  }, [options])
  const recents = recent.map((v) => byValue.get(v)).filter((o): o is ComboboxOption => !!o)
  const exact = options.some((o) => o.label.toLowerCase() === q.toLowerCase())
  const rowCls = cn("flex cursor-pointer items-center gap-2 rounded-md px-2 text-sm outline-none",
                    "data-[selected=true]:bg-accent data-[disabled=true]:opacity-50",
                    phone ? "h-11 text-[15px]" : "h-8")

  const item = (o: ComboboxOption, key: string) => (
    <Command.Item key={key} value={key} keywords={[o.label, o.group ?? "", ...(o.keywords ?? [])]}
                  onSelect={() => pick(o.value, o)} className={rowCls}>
      <span className="min-w-0 flex-1 truncate">{o.label}</span>
      {o.hint && <span className="shrink-0 text-xs text-muted-foreground">{o.hint}</span>}
      <CheckIcon className={cn("size-4 shrink-0", o.value === value ? "opacity-100" : "opacity-0")} />
    </Command.Item>
  )

  return (
    <Command label={label} filter={match} className={cn("flex flex-col",
      "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1",
      "[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      // Options under a titled group indent 12px past its caption, so a caption reads as a
      // heading by position (UX Designer Decisions (72)). An untitled group renders no
      // heading, so its rows (and the "Add …" row) stay flush.
      "[&_[cmdk-group-heading]+[cmdk-group-items]_[cmdk-item]]:pl-5",
      phone && "min-h-0 flex-1")}>
      <div className={cn("flex items-center gap-2 border-b border-border px-3", phone ? "mx-4 mb-2 h-11 rounded-lg border" : "h-9")}>
        <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
        <Command.Input ref={inputRef} value={query} onValueChange={setQuery} placeholder={searchPlaceholder}
                       className={cn("h-full w-full bg-transparent outline-none placeholder:text-muted-foreground",
                                     phone ? "text-[16px]" : "text-sm")} />
      </div>
      <Command.List className={cn("overflow-y-auto p-1", phone ? "min-h-0 flex-1 px-2 pb-6" : "max-h-72")}>
        {freeText && q && !exact && (
          <Command.Group heading="Use as typed" forceMount>
            <Command.Item value={`typed:${q}`} forceMount onSelect={() => pick(q)} className={rowCls}>
              <span className="truncate">“{q}”</span>
            </Command.Item>
          </Command.Group>
        )}
        {!q && recents.length > 0 && (
          <Command.Group heading={recentLabel}>
            {recents.map((o) => item(o, `recent:${o.value}`))}
          </Command.Group>
        )}
        {groups.map(([g, os]) => (
          <Command.Group key={g || "_"} heading={g || undefined}>
            {os.map((o) => item(o, o.value))}
          </Command.Group>
        ))}
        {onCreate && q && !exact && (
          <Command.Item value={`create:${q}`} forceMount onSelect={() => { onCreate(q); onDone() }} className={rowCls}>
            <PlusIcon className="size-4 text-muted-foreground" />
            <span className="truncate">{createLabel(q)}</span>
          </Command.Item>
        )}
        {!(freeText && q) && !(onCreate && q) && (
          <Command.Empty className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyText}</Command.Empty>
        )}
      </Command.List>
    </Command>
  )
}

export { Combobox }
export type { ComboboxOption, ComboboxProps }
