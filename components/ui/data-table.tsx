"use client"

import * as React from "react"
import { ChevronDownIcon, ChevronUpIcon, Columns3Icon, GripVerticalIcon, SigmaIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control"
import {
  Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { useIsPhone } from "@/hooks/use-phone"

/**
 * The data table every app uses, promoted from PBJ Chalet (UX Designer Decisions (49)): sort,
 * filter, grouping with subtotals, column order and visibility, saved preferences. Below 480px
 * each row becomes a card (§ Responsive): the `primary` column and the `value` column on the
 * first line, the `meta` columns joined by " · " on the second, under each group's subtotal.
 */

/** Per-viewer view state. localStorage is the right home: it is a convenience, not shared
 *  truth. Wrapped because a private window makes the accessor itself throw, and a table that
 *  cannot render is worse than one that forgets a column choice. */
function loadPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...(JSON.parse(raw) as object) } as T : fallback
  } catch { return fallback }
}
/** useLayoutEffect in the browser (no flash of default preferences), useEffect on a server. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

function savePref<T>(key: string, value: T) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* nothing to do */ }
}

/** Which columns show, in what order, and which subtotals are off. */
export type DataTableColumns = { order: string[]; hidden: string[]; nosub: string[] }

/** Where an app keeps the column choices so they follow the viewer across devices (PBJ
 *  Chalet keeps them on its server). Left out, they stay in this browser. Failures are
 *  swallowed: a table that forgets a column choice still works. */
export type DataTableColumnsStore = {
  load: () => Promise<Partial<DataTableColumns> | null>
  save: (columns: DataTableColumns) => Promise<unknown> | void
}

/** Column definitions are data, not markup: one array drives the header, every row and
 *  the picker. A hardcoded header cannot be made configurable later without a rewrite. */
export type Col<T> = {
  key: string
  label: string
  align?: "right"
  pinned?: boolean          // identity: a row identifying nothing is meaningless
  offByDefault?: boolean
  /** Sortable when present. Returns the value to order by, which is often not what the
   *  cell displays — "Sep 4 – Sep 7" sorts by the check-in date, never by its own text. */
  sort?: (row: T) => string | number | null
  render: (row: T) => React.ReactNode
  /** The column's cell in a totals row, given the rows the table is showing. A table with
   *  no column that totals has no totals row. */
  total?: (rows: T[]) => React.ReactNode
  /** Its part in a phone row: `primary` (first line, left), `value` (first line, right),
   *  `meta` (second line) or `hide`. Unset: the pinned column is primary, the last
   *  right-aligned column is the value, and the rest are meta. */
  phone?: "primary" | "value" | "meta" | "hide"
}

/** A grouping the table offers. `order` fixes the sequence of the group headers where
 *  the labels have a natural one (months, quarters); without it they sort alphabetically,
 *  which is right for a channel and wrong for a month. */
export type Grouping<T> = {
  key: string
  label: string
  of: (row: T) => string
  order?: string[]
}

export type Sort = { key: string; dir: "asc" | "desc" }

export function DataTable<T>({ rows, cols, groupings, filters = [], defaultSort,
                               rowKey, prefsKey, noun, onRowClick, rowClassName,
                               totalRows, controlsOpen, onFiltering, columnsStore }: {
  rows: T[]
  cols: Col<T>[]
  groupings: Grouping<T>[]
  /** Filters take the same shape as groupings, and Bookings passes the same objects to
   *  both: filtering and grouping by "status" have to mean the same thing, or the two
   *  controls quietly describe different vocabularies. */
  filters?: Grouping<T>[]
  defaultSort: Sort
  rowKey: (row: T) => React.Key
  prefsKey: string
  noun: string
  /** Row detail opens in place (UX Designer Standards, Data display). The whole row takes
   *  the click; keyboard and screen-reader users reach it through a hit-area button the
   *  identity column renders, so the table keeps its row semantics. */
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string | undefined
  /** Which of the shown rows the totals row sums -- Statements totals saved months only. */
  totalRows?: (rows: T[]) => T[]
  /** Given, the controls live in a hide/show panel the page opens with its own gear, like
   *  the revenue chart's (Bookings, BS 2026-11-21). Left out, they stay a sticky bar. */
  controlsOpen?: boolean
  /** Told whether any filter is on, so a closed panel can still say so. */
  onFiltering?: (on: boolean) => void
  /** Keeps the column order, hidden set and subtotal choices across devices. */
  columnsStore?: DataTableColumnsStore
}) {
  type Columns = DataTableColumns
  const isPhone = useIsPhone()
  type Prefs = Columns & { group: string; pick: Record<string, string[]>; sort: Sort }
  const defaultHidden = React.useMemo(
    () => cols.filter((c) => c.offByDefault).map((c) => c.key), [cols])
  const defaultOrder = React.useMemo(() => cols.map((c) => c.key), [cols])
  const defaults: Prefs = React.useMemo(
    () => ({ hidden: defaultHidden, order: defaultOrder, nosub: [],
             group: "none", pick: {}, sort: defaultSort }),
    [defaultHidden, defaultOrder, defaultSort])

  // Saved preferences load before first paint, not during render: a server render (Next)
  // cannot see this browser's storage, and reading it in render made the server's HTML and
  // the client's disagree (hydration mismatch, measured in the showcase 2026-11-25).
  const [prefs, setPrefs] = React.useState<Prefs>(defaults)
  useIsomorphicLayoutEffect(() => {
    setPrefs((() => {
      const p = loadPref(prefsKey, defaults)
      // A filter used to hold one value. A browser that stored a string would make
      // `.includes()` a substring test here, so the shape is coerced on the way in
      // rather than trusted — persisted state outlives the code that wrote it.
      const pick: Record<string, string[]> = {}
      for (const [k, v] of Object.entries(p.pick ?? {}))
        pick[k] = Array.isArray(v) ? v : v ? [v as unknown as string] : []
      return { ...p, pick, sort: p.sort ?? defaultSort }
    })())
  }, [prefsKey])

  const filtering = Object.values(prefs.pick).some((v) => v.length > 0)
  React.useEffect(() => { onFiltering?.(filtering) }, [filtering, onFiltering])

  const update = (p: Partial<Prefs>) =>
    setPrefs((s) => { const next = { ...s, ...p }; savePref(prefsKey, next); return next })

  // Which columns show, and in what order, can follow the viewer across devices (UX Designer
  // Decisions 43): saved through `columnsStore`. Grouping, filters and
  // sort stay this browser's. A saved list is trusted only for columns that still exist; one
  // added since goes on the end. With nothing on the server yet, this browser's own hidden
  // set is the starting point and is saved up, so the first load loses nothing.
  const reconcile = React.useCallback((v: Partial<Record<keyof Columns, unknown>>): Columns => {
    const keys = new Set(defaultOrder)
    const known = (x: unknown) => Array.isArray(x) ? x.filter((k): k is string => keys.has(k)) : null
    const o = known(v.order) ?? []
    return {
      order: [...o, ...defaultOrder.filter((k) => !o.includes(k))],
      hidden: known(v.hidden) ?? defaultHidden,
      nosub: known(v.nosub) ?? [],
    }
  }, [defaultOrder, defaultHidden])

  const saveColumns = (c: Columns) => {
    update(c)
    if (columnsStore) Promise.resolve().then(() => columnsStore.save(c)).catch(() => {})
  }

  React.useEffect(() => {
    if (!columnsStore) return
    let live = true
    columnsStore.load()
      .then((v) => {
        if (!live) return
        if (v) {
          const c = reconcile(v)
          setPrefs((s) => ({ ...s, ...c }))
        } else {
          setPrefs((s) => {
            const c = reconcile(s)
            Promise.resolve().then(() => columnsStore.save(c)).catch(() => {})
            return { ...s, ...c }
          })
        }
      })
      .catch(() => {})
    return () => { live = false }
  }, [columnsStore, reconcile])

  // The pinned column leads whatever the saved order says: a row identifying nothing is
  // meaningless, and so is one whose identity sits in the middle.
  const ordered = React.useMemo(() => {
    const { order } = reconcile(prefs)
    const byKey = new Map(cols.map((c) => [c.key, c]))
    const all = order.map((k) => byKey.get(k)!)
    return [...all.filter((c) => c.pinned), ...all.filter((c) => !c.pinned)]
  }, [cols, prefs, reconcile])
  const shown = ordered.filter((c) => c.pinned || !prefs.hidden.includes(c.key))
  const current = (): Columns =>
    ({ order: ordered.map((c) => c.key), hidden: prefs.hidden, nosub: prefs.nosub ?? [] })
  const flip = (xs: string[], k: string) => xs.includes(k) ? xs.filter((x) => x !== k) : [...xs, k]
  const toggleCol = (k: string) => saveColumns({ ...current(), hidden: flip(prefs.hidden, k) })
  /** A column's subtotal in the group rows, on or off (BS, 2026-11-22). The Total row keeps it. */
  const toggleSub = (k: string) => saveColumns({ ...current(), nosub: flip(prefs.nosub ?? [], k) })
  const subOn = (k: string) => !(prefs.nosub ?? []).includes(k)
  /** Moves column `k` to sit where `to` is now. */
  const moveCol = (k: string, to: string) => {
    const keys = ordered.map((c) => c.key).filter((x) => x !== k)
    keys.splice(ordered.findIndex((c) => c.key === to), 0, k)
    saveColumns({ ...current(), order: keys })
  }
  const movable = ordered.filter((c) => !c.pinned)
  const step = (k: string, by: -1 | 1) => {
    const i = movable.findIndex((c) => c.key === k)
    const to = movable[i + by]
    if (to) moveCol(k, to.key)
  }
  const [dragged, setDragged] = React.useState<string | null>(null)
  const [over, setOver] = React.useState<string | null>(null)
  const customised = ordered.some((c, i) => c.key !== defaultOrder[i])
    || [...prefs.hidden].sort().join() !== [...defaultHidden].sort().join()
    || (prefs.nosub ?? []).length > 0

  // Options come off the rows themselves, so a filter never offers a value that would
  // empty the table, and the list is drawn from every row rather than the visible ones —
  // an option list that shrinks as you use it cannot be used to get back.
  const options = React.useMemo(() =>
    Object.fromEntries(filters.map((f) => {
      const vals = [...new Set(rows.map(f.of))]
      vals.sort((a, b) => f.order ? f.order.indexOf(a) - f.order.indexOf(b) : a.localeCompare(b))
      return [f.key, vals]
    })), [rows, filters])

  // Within a filter the values are alternatives; across filters they compound. Choosing
  // two statuses widens the result, choosing a status and a month narrows it — which is
  // what a person means by ticking two boxes in one list versus two boxes in two.
  const kept = React.useMemo(() =>
    rows.filter((r) => filters.every((f) => {
      const want = prefs.pick[f.key]
      return !want?.length || want.includes(f.of(r))
    })), [rows, filters, prefs.pick])

  const sortCol = cols.find((c) => c.key === prefs.sort.key && c.sort)
  const sorted = React.useMemo(() => {
    if (!sortCol?.sort) return kept
    const dir = prefs.sort.dir === "asc" ? 1 : -1
    const key = sortCol.sort
    // Missing values sink whichever way the column is pointed: a row with no figure is
    // not the smallest figure, and floating it to the top buries the ones that exist.
    return [...kept].sort((a, b) => {
      const av = key(a), bv = key(b)
      if (av === null) return bv === null ? 0 : 1
      if (bv === null) return -1
      return av === bv ? 0 : (av < bv ? -1 : 1) * dir
    })
  }, [kept, sortCol, prefs.sort.dir])

  const active = groupings.find((g) => g.key === prefs.group)
  const groups = React.useMemo(() => {
    if (!active) return [{ label: null as string | null, rows: sorted }]
    const m = new Map<string, T[]>()
    for (const r of sorted) {
      const k = active.of(r)
      m.set(k, [...(m.get(k) ?? []), r])
    }
    // Group headers follow the sort. Rows running December to January under headers
    // running January to December is the table disagreeing with itself.
    const dir = prefs.sort.dir === "asc" ? 1 : -1
    const order = active.order
    return [...m.keys()]
      .sort((a, b) => (order ? order.indexOf(a) - order.indexOf(b) : a.localeCompare(b)) * dir)
      .map((label) => ({ label, rows: m.get(label)! }))
  }, [sorted, active, prefs.sort.dir])

  // First click takes a column descending: every sortable column here is a date or a
  // figure, and the question is always "the biggest / most recent first".
  const clickSort = (key: string) =>
    update({ sort: prefs.sort.key === key
      ? { key, dir: prefs.sort.dir === "desc" ? "asc" : "desc" }
      : { key, dir: "desc" } })

  return (
    <div className="flex flex-col">
      {/* Sticky so the controls stay reachable in a long table, offset by the shell's
          header (`--shell-header`, set by Shell; 3.5rem without one): the document is the
          scroll container, so top-0 would park this bar underneath the page header. */}
      {controlsOpen !== false && (
      <div className={controlsOpen === undefined
        ? "sticky top-[var(--shell-header,3.5rem)] z-10 flex flex-wrap items-center gap-2 border-b border-border bg-card px-4 py-2.5"
        : "mx-4 mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 p-3.5"}>
        <span className="text-xs text-muted-foreground">Group by</span>
        {/* Scrolls sideways inside the panel rather than past it: Income's five choices
            are wider than a phone's panel. */}
        <div className="max-w-full overflow-x-auto">
          <SegmentedControl value={prefs.group} onValueChange={(g) => update({ group: g })}>
            {[{ key: "none", label: "None" }, ...groupings].map((g) => (
              <SegmentedControlItem key={g.key} value={g.key}>{g.label}</SegmentedControlItem>
            ))}
          </SegmentedControl>
        </div>

        {/* A rule and a word between the two clusters: without them the last grouping
            button ("Status") sat flush against the first filter's label ("Status"), and
            the pair read as one broken control. */}
        {filters.length > 0 && (
          <>
            <span className="mx-0.5 h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground">Filter</span>
          </>
        )}
        {filters.map((f) => {
          const on = prefs.pick[f.key] ?? []
          const set = (vals: string[]) => update({ pick: { ...prefs.pick, [f.key]: vals } })
          return (
            <Dropdown key={f.key} align="left" label={
              <>
                {f.label}
                {on.length > 0 && (
                  <span className="ml-1 rounded bg-primary/15 px-1 font-medium text-primary">
                    {on.length}
                  </span>
                )}
              </>
            }>
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[11px] tracking-wide text-muted-foreground uppercase">
                  {f.label}
                </span>
                <Button variant="ghost" size="xs" disabled={on.length === 0}
                        onClick={() => set([])}
                        className="-mr-1 h-5 px-1.5 text-[11px] font-normal
                                   text-muted-foreground">
                  Clear
                </Button>
              </div>
              {options[f.key]?.map((v) => (
                <Tick key={v} checked={on.includes(v)} label={v} capitalize
                      onChange={() =>
                        set(on.includes(v) ? on.filter((x) => x !== v) : [...on, v])} />
              ))}
            </Dropdown>
          )
        })}

        {/* A phone drops the plain count -- it is noise beside the table that follows
            (BS, 2026-09-20) -- but keeps "12 of 71", which is the only thing on screen
            saying a filter is on. An empty table with a forgotten filter cost real time on
            2026-09-19. */}
        <span className={`ml-auto text-xs text-muted-foreground
                          ${kept.length < rows.length ? "" : "hidden min-[480px]:inline"}`}>
          {kept.length < rows.length && <>{kept.length} of </>}
          {rows.length} {noun}{rows.length === 1 ? "" : "s"}
        </span>

        {/* Show, hide and reorder in one list, in the table's own order. Drag the grip with
            a pointer; the arrows are for a finger (Safari on a phone has no drag) and the
            keyboard. The pinned column stays first and fixed. */}
        <Dropdown align="right" label={<><Columns3Icon />Columns</>} wide>
          {ordered.map((c) => {
            const i = movable.findIndex((m) => m.key === c.key)
            return (
              <div key={c.key}
                   draggable={!c.pinned}
                   onDragStart={(e) => { setDragged(c.key); e.dataTransfer.effectAllowed = "move" }}
                   onDragOver={(e) => { if (dragged && !c.pinned) { e.preventDefault(); setOver(c.key) } }}
                   onDragLeave={() => setOver((o) => (o === c.key ? null : o))}
                   onDrop={(e) => {
                     e.preventDefault()
                     if (dragged && dragged !== c.key) moveCol(dragged, c.key)
                     setDragged(null); setOver(null)
                   }}
                   onDragEnd={() => { setDragged(null); setOver(null) }}
                   className={`flex items-center rounded-md
                               ${dragged === c.key ? "opacity-40" : ""}
                               ${over === c.key && dragged !== c.key ? "bg-accent ring-1 ring-primary/60" : ""}`}>
                <span className={`flex w-5 shrink-0 justify-center text-muted-foreground
                                  ${c.pinned ? "opacity-0" : "cursor-grab active:cursor-grabbing"}`}
                      aria-hidden>
                  <GripVerticalIcon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <Tick label={c.label} disabled={c.pinned}
                        checked={c.pinned || !prefs.hidden.includes(c.key)}
                        onChange={() => toggleCol(c.key)}
                        note={c.pinned ? "pinned" : undefined} />
                </div>
                {!c.pinned && (
                  <span className="flex shrink-0">
                    {/* Σ: this column's subtotal in the group rows. Only columns that total
                        have one; the rest keep the space so the arrows line up. */}
                    {c.total ? (
                      <Button variant="ghost" size="icon-xs" aria-pressed={subOn(c.key)}
                              aria-label={`${c.label} subtotal in groups`}
                              title={subOn(c.key) ? "Subtotal shown in groups" : "Subtotal hidden in groups"}
                              onClick={() => toggleSub(c.key)}
                              className={`size-7 max-sm:size-11 ${subOn(c.key) ? "text-primary" : "text-muted-foreground/50"}`}>
                        <SigmaIcon />
                      </Button>
                    ) : <span className="size-7 max-sm:size-11" />}
                    <Button variant="ghost" size="icon-xs" aria-label={`Move ${c.label} up`}
                            disabled={i === 0} onClick={() => step(c.key, -1)}
                            className="size-7 max-sm:size-11">
                      <ChevronUpIcon />
                    </Button>
                    <Button variant="ghost" size="icon-xs" aria-label={`Move ${c.label} down`}
                            disabled={i === movable.length - 1} onClick={() => step(c.key, 1)}
                            className="size-7 max-sm:size-11">
                      <ChevronDownIcon />
                    </Button>
                  </span>
                )}
              </div>
            )
          })}
          <div className="mt-1 flex justify-end border-t border-border px-1 pt-1.5">
            <Button variant="ghost" size="xs" disabled={!customised}
                    onClick={() => saveColumns({ order: defaultOrder, hidden: defaultHidden, nosub: [] })}
                    className="text-[12px] font-normal text-muted-foreground">
              Reset
            </Button>
          </div>
        </Dropdown>
      </div>
      )}

      {isPhone ? (
        <PhoneRows shown={shown} groups={groups} kept={kept} rowKey={rowKey} onRowClick={onRowClick}
                   rowClassName={rowClassName} totalRows={totalRows} subOn={subOn} />
      ) : (
      /* No row lines, a quiet rule under the shaded header and over the totals, and no
         hover on the header: the package's table defaults (BS, 2026-09-18). */
      <Table>
        <TableHeader>
          <TableRow>
            {shown.map((c) => {
              const on = prefs.sort.key === c.key
              return (
                <TableHead key={c.key} aria-sort={
                  !c.sort ? undefined : on
                    ? (prefs.sort.dir === "asc" ? "ascending" : "descending")
                    : "none"}
                  className={c.align === "right" ? "text-right" : undefined}>
                  {/* A column-header sort affordance, not a Button: it inherits the
                      header cell's type and alignment, and Button's height, padding and
                      hover fill would break the header row. */}
                  {c.sort ? (
                    <button type="button" onClick={() => clickSort(c.key)}
                            className={`group inline-flex cursor-pointer items-center gap-1
                                        ${c.align === "right" ? "flex-row-reverse" : ""}
                                        ${on ? "text-foreground" : "hover:text-foreground"}`}>
                      {c.label}
                      {/* The inactive arrow only appears on hover: nine permanent arrows
                          would say nothing about which column is actually sorted. */}
                      <SortMark on={on} dir={prefs.sort.dir} />
                    </button>
                  ) : c.label}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        {/* The group header draws its own rules, on its cell. */}
        <TableBody>
          {groups.map((g) => (
            <React.Fragment key={g.label ?? "all"}>
              {g.label && (
                // A subtotal row (BS, 2026-11-22, UX Designer Decisions 44, 45): the label in the
                // first column, and under every other column that totals, the group's own
                // figure, right-aligned like the Total row. Each column's subtotal can be turned
                // off from the Columns menu. No count: the label and figures say enough.
                <TableRow className="hover:bg-transparent">
                  {shown.map((c, ci) => (
                    <TableCell key={c.key}
                               // The row type size, a solid fill and a rule both sides, and the
                               // only weight in the body: the rows are regular (BS, 2026-11-22).
                               className={`border-y border-border bg-muted py-2.5 font-semibold
                                           tabular-nums whitespace-nowrap
                                           ${c.align === "right" ? "text-right" : ""}`}>
                      {ci === 0 ? <span className="tracking-wider uppercase">{g.label}</span>
                        : c.total && subOn(c.key)
                        ? c.total(totalRows ? totalRows(g.rows) : g.rows) : null}
                    </TableCell>
                  ))}
                </TableRow>
              )}
              {g.rows.map((r) => (
                <TableRow key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined}
                          className={`${onRowClick ? "cursor-pointer" : ""} ${rowClassName?.(r) ?? ""}`}>
                  {shown.map((c) => (
                    // Top-aligned, so a cell with a second line (a delta under a value) keeps
                    // its first line level with the rest of the row (BS, 2026-09-19).
                    <TableCell key={c.key}
                               className={`align-top tabular-nums ${c.align === "right" ? "text-right" : ""}`}>
                      {c.render(r)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </React.Fragment>
          ))}
        </TableBody>
        {shown.some((c) => c.total) && (
          <TableFooter>
            <TableRow className="hover:bg-transparent">
              {shown.map((c) => (
                <TableCell key={c.key}
                           className={`align-top font-semibold tabular-nums ${c.align === "right" ? "text-right" : ""}`}>
                  {c.total?.(totalRows ? totalRows(kept) : kept)}
                </TableCell>
              ))}
            </TableRow>
          </TableFooter>
        )}
      </Table>
      )}
    </div>
  )
}

/** The table below 480px: one card per row, the group's subtotal over its rows, and the
 *  total at the end (§ Responsive; UX Designer Decisions (49)). */
function PhoneRows<T>({ shown, groups, kept, rowKey, onRowClick, rowClassName, totalRows, subOn }: {
  shown: Col<T>[]
  groups: { label: string | null; rows: T[] }[]
  kept: T[]
  rowKey: (row: T) => React.Key
  onRowClick?: (row: T) => void
  rowClassName?: (row: T) => string | undefined
  totalRows?: (rows: T[]) => T[]
  subOn: (key: string) => boolean
}) {
  const visible = shown.filter((c) => c.phone !== "hide")
  const primary = visible.find((c) => c.phone === "primary") ?? visible.find((c) => c.pinned) ?? visible[0]
  const value = visible.find((c) => c.phone === "value")
    ?? [...visible].reverse().find((c) => c.align === "right" && c !== primary && !c.phone)
  const flagged = visible.some((c) => c.phone === "meta")
  const metas = visible.filter((c) => c !== primary && c !== value && (flagged ? c.phone === "meta" : !c.phone))
  const total = (rows: T[]) => value?.total?.(totalRows ? totalRows(rows) : rows)

  return (
    <div data-slot="data-table-phone" className="flex flex-col">
      {groups.map((g) => (
        <React.Fragment key={g.label ?? "all"}>
          {g.label && (
            <div className="flex items-center justify-between border-y border-border bg-muted px-4 py-2
                            text-xs font-semibold tracking-wider uppercase tabular-nums">
              <span>{g.label}</span>
              {value && subOn(value.key) && <span>{total(g.rows)}</span>}
            </div>
          )}
          <ul>
            {g.rows.map((r) => {
              const body = (
                <>
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 truncate text-[15px]">{primary?.render(r)}</span>
                    {value && <span className="shrink-0 text-[15px] tabular-nums">{value.render(r)}</span>}
                  </span>
                  {metas.length > 0 && (
                    <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
                      {metas.map((c, i) => (
                        <React.Fragment key={c.key}>
                          {i > 0 && <span aria-hidden>·</span>}
                          <span className="min-w-0">{c.render(r)}</span>
                        </React.Fragment>
                      ))}
                    </span>
                  )}
                </>
              )
              return (
                <li key={rowKey(r)} className={rowClassName?.(r)}>
                  {onRowClick ? (
                    <button type="button" onClick={() => onRowClick(r)}
                            className="flex min-h-11 w-full flex-col px-4 py-2.5 text-left hover:bg-muted/50
                                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset">
                      {body}
                    </button>
                  ) : (
                    <div className="flex flex-col px-4 py-2.5">{body}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </React.Fragment>
      ))}
      {value?.total && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[15px] font-semibold tabular-nums">
          <span>Total</span>
          <span>{total(kept)}</span>
        </div>
      )}
    </div>
  )
}



/** One popover, used by the column picker and by every filter. Each owns its open state
 *  so two can never fight over one boolean, and each closes on an outside click or Escape:
 *  a panel that only closes from the control that opened it is a trap on a long table. */
function Dropdown({ label, align, wide, children }: {
  label: React.ReactNode; align: "left" | "right"; wide?: boolean; children: React.ReactNode
}) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm">{label}</Button>} />
      {/* Outside-click, Escape, focus return, portalling and collision flipping all
          come from the primitive now. The hand-rolled version re-solved the first two
          with document listeners and never handled the last two at all — which only
          showed up as a panel clipped at the bottom of a long table. */}
      <PopoverContent align={align === "right" ? "end" : "start"}
                      className={`flex max-h-[60vh] flex-col gap-0.5 overflow-y-auto ${wide ? "w-72" : "w-56"}`}>
        {children}
      </PopoverContent>
    </Popover>
  )
}

function Tick({ checked, onChange, label, disabled, note, capitalize }: {
  checked: boolean; onChange: () => void; label: string
  disabled?: boolean; note?: string; capitalize?: boolean
}) {
  return (
    <label className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]
                       ${capitalize ? "capitalize" : ""}
                       ${disabled ? "opacity-55" : "cursor-pointer hover:bg-accent"}`}>
      <Checkbox checked={checked} disabled={disabled}
                onCheckedChange={onChange} className="size-3.5" />
      <span className="min-w-0 truncate">{label}</span>
      {note && <span className="ml-auto shrink-0 text-[10px] tracking-wide
                                text-muted-foreground uppercase">{note}</span>}
    </label>
  )
}


function SortMark({ on, dir }: { on: boolean; dir: "asc" | "desc" }) {
  const Icon = on && dir === "asc" ? ChevronUpIcon : ChevronDownIcon
  return <Icon className={`size-3.5 shrink-0 ${on ? "" : "opacity-0 group-hover:opacity-40"}`} />
}

/** Package-scoped names for the column, grouping and sort types. */
export type { Col as DataTableColumn, Grouping as DataTableGrouping, Sort as DataTableSort }
