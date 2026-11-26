"use client"

import * as React from "react"
import {
  CameraIcon, ChartColumnIcon, ChevronDownIcon, ListIcon, ReceiptIcon, RepeatIcon,
  SettingsIcon, TagsIcon, UploadIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { type Col, DataTable, type Grouping } from "@/components/ui/data-table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Shell, useShellPhone } from "@/components/ui/shell"
import { Skeleton } from "@/components/ui/skeleton"
import { StatTile } from "@/components/ui/stat-tile"
import { Empty, Failed, Partial } from "@/components/ui/states"
import { toast } from "@/components/ui/toast"
import { ThemeToggle } from "@/components/theme-toggle"

/**
 * The release showcase: Shell, DataTable (with phone rows), StatTile, Combobox, the
 * States (v0.3.0), Toast (v0.4.0) and DataTable's defaultGroup (v0.4.1), framed the way the Expense System will use them.
 * Sample data only.
 */
type Row = { id: number; date: string; month: string; description: string | null; vendor: string;
             category: string; sub: string; amount: number }

const ROWS: Row[] = [
  [1, "2026-11-20", "Furnace filters", "Home Depot", "Supplies", "General", 84.17],
  [2, "2026-11-18", "Electric", "PPL Electric", "Utilities", "Electricity", 212.06],
  [3, "2026-11-12", "Snow plowing 11/12", "True North", "Grounds", "Snow removal", 350],
  [4, "2026-11-09", "Flight to PIT", "Delta", "Travel", "Flights", 612.4],
  [5, "2026-11-09", null, "Sbarro", "Meals", "Travel meals", 38.77],
  [6, "2026-10-27", "Mulch", "Lowe's", "Supplies", "General", 61.12],
  [7, "2026-10-21", "Mulch", "Lowe's", "Supplies", "General", -18.4],
  [8, "2026-10-04", null, "Bed Bath & Beyond", "Supplies", "Bedding", 92.55],
].map(([id, date, description, vendor, category, sub, amount]) => ({
  id: id as number, date: date as string, description: description as string | null, vendor: vendor as string,
  category: category as string, sub: sub as string, amount: amount as number,
  month: new Date(`${date}T12:00`).toLocaleString("en-US", { month: "long" }),
}))

const money = (n: number) => (n < 0 ? "−$" : "$") + Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const day = (d: string) => new Date(`${d}T12:00`).toLocaleString("en-US", { month: "short", day: "numeric" })

const VENDORS: ComboboxOption[] = ["Home Depot", "Lowe's", "PPL Electric", "True North", "Delta", "Sbarro", "Wegmans"]
  .map((v) => ({ value: v, label: v }))
const SUBS: ComboboxOption[] = [
  ["Utilities", ["Electricity", "Gas", "Internet"]], ["Supplies", ["General", "Kitchen", "Bedding", "Cleaning"]],
  ["Grounds", ["Lawn care", "Snow removal", "Leaf cleanup"]], ["Travel", ["Flights", "Lodging", "Car rental"]],
  ["Meals", ["Travel meals", "Other meals"]],
].flatMap(([g, subs]) => (subs as string[]).map((s) => ({ value: `${g}/${s}`, label: s, group: g as string })))
const DESCRIPTIONS: ComboboxOption[] = [
  { value: "Furnace filters", label: "Furnace filters", hint: "Sep 2026" },
  { value: "Water filter cartridge", label: "Water filter cartridge", hint: "Mar 2026" },
  { value: "Air filter, upstairs", label: "Air filter, upstairs", hint: "Repairs" },
]

function ExpensesPage({ onAdd }: { onAdd: () => void }) {
  const phone = useShellPhone()
  const [state, setState] = React.useState<"ready" | "loading" | "empty" | "failed">("ready")
  const cols: Col<Row>[] = [
    { key: "date", label: "Date", pinned: false, phone: "meta", sort: (r) => r.date, render: (r) => day(r.date) },
    { key: "description", label: "Description", pinned: true, phone: "primary",
      render: (r) => r.description ?? (phone ? r.vendor : <span className="text-muted-foreground">—</span>) },
    { key: "vendor", label: "Vendor", phone: "meta", sort: (r) => r.vendor, render: (r) => r.vendor },
    { key: "sub", label: "Subcategory", phone: "meta",
      render: (r) => <><span className="text-muted-foreground">{r.category} › </span>{r.sub}</> },
    { key: "amount", label: "Amount", align: "right", phone: "value", sort: (r) => r.amount,
      render: (r) => <span className={r.amount < 0 ? "text-destructive" : undefined}>{money(r.amount)}</span>,
      total: (rs) => money(rs.reduce((a, r) => a + r.amount, 0)) },
  ]
  const groupings: Grouping<Row>[] = [
    { key: "month", label: "Month", of: (r) => r.month, order: ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"] },
    { key: "category", label: "Category", of: (r) => r.category },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Essential" value="$21,122.58" sub="65 expenses" onClick={() => {}}
                  comparison={{ was: "$19,804.10", change: { text: "+7%", tone: "worse" }, against: "2025 · same point" }} />
        <StatTile label="Travel" value="$15,057.25" sub={<span className="text-info">+$412.00 in review</span>} onClick={() => {}}
                  comparison={{ was: "$16,210.00", change: { text: "−7%", tone: "better" }, against: "2025 · same point" }} />
        <StatTile label="Other" value="$8,818.65" sub="42 expenses" onClick={() => {}} comparison={null} />
        <StatTile label="December" badge="scheduled" value={null} sub="nothing paid yet" />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        {!phone && (
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-2xl">Expenses</CardTitle>
            <span className="text-xs text-muted-foreground">States:</span>
          </CardHeader>
        )}
        <div className="flex flex-wrap gap-1.5 px-4 pb-3 max-[479px]:pt-3">
          {(["ready", "loading", "empty", "failed"] as const).map((s) => (
            <Button key={s} size="xs" variant={state === s ? "default" : "outline"} onClick={() => setState(s)}>{s}</Button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
          <span className="text-xs text-muted-foreground">Toasts:</span>
          <Button size="xs" variant="outline" onClick={() => toast.success("Saved “Furnace filters”")}>Saved</Button>
          <Button size="xs" variant="outline" onClick={() => toast.success("Deleted “Mulch”", { undo: () => toast.info("Restored “Mulch”") })}>Delete, with Undo</Button>
          <Button size="xs" variant="outline" onClick={() => toast.error("Couldn't save. The server didn't answer.")}>Error</Button>
          <Button size="xs" variant="outline" onClick={() => ["Electric", "Mulch", "Flight to PIT", "Snow plowing 11/12"].forEach((d) => toast.success(`Accepted “${d}”`))}>Four at once</Button>
        </div>
        {state === "loading" && <div className="flex flex-col gap-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-9" />)}</div>}
        {state === "empty" && <Empty title="No expenses in 2026 yet" detail="Add a receipt, or pick another year."
                                     action={{ label: "Add receipt", onClick: onAdd }} />}
        {state === "failed" && <div className="p-4"><Failed what="Expenses" message="The server didn't answer." onRetry={() => setState("ready")} /></div>}
        {state === "ready" && (
          <>
            <div className="px-4 pb-3"><Partial>5 waiting for review, not in any totals until accepted.</Partial></div>
            <DataTable rows={ROWS} cols={cols} groupings={groupings} filters={[groupings[1]]}
                       defaultSort={{ key: "date", dir: "desc" }} defaultGroup="month" rowKey={(r) => r.id} prefsKey="release-demo.expenses"
                       noun="expense" onRowClick={() => onAdd()} />
          </>
        )}
      </Card>
    </div>
  )
}

function AddDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [vendor, setVendor] = React.useState<string | null>("Home Depot")
  const [sub, setSub] = React.useState<string | null>("Supplies/General")
  const [desc, setDesc] = React.useState<string | null>(null)
  const [vendors, setVendors] = React.useState(VENDORS)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-[479px]:h-full max-[479px]:max-w-full max-[479px]:rounded-none sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
          <DialogDescription>Combobox: vendor with “Add new”, subcategory in groups with recent, description as free text.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5"><Label>Vendor</Label>
            <Combobox label="Vendor" options={vendors} value={vendor} onValueChange={setVendor} recent={["Home Depot", "Lowe's"]}
                      onCreate={(q) => { setVendors((v) => [...v, { value: q, label: q }]); setVendor(q) }} />
          </div>
          <div className="grid gap-1.5"><Label>Subcategory</Label>
            <Combobox label="Subcategory" options={SUBS} value={sub} onValueChange={setSub}
                      recent={["Supplies/General", "Grounds/Snow removal"]} recentLabel="Recent for Home Depot" />
          </div>
          <div className="grid gap-1.5"><Label>Description <span className="font-normal text-muted-foreground">(Optional)</span></Label>
            <Combobox label="Description" options={DESCRIPTIONS} value={desc} onValueChange={setDesc} freeText
                      placeholder="Furnace filters, Mulch…" searchPlaceholder="Type or pick" emptyText="Nothing yours matches." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); toast.info("Saved for review") }}>Save for later</Button>
          <Button onClick={() => { onOpenChange(false); toast.success(`Saved “${desc ?? vendor ?? "expense"}”`) }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ReleaseShowcase() {
  const [active, setActive] = React.useState("expenses")
  const [adding, setAdding] = React.useState(false)
  const [long, setLong] = React.useState(false)
  const titles: Record<string, string> = { expenses: "Expenses", spending: "Spending", recurring: "Recurring", lists: "Lists", settings: "Settings" }
  return (
    <Shell
      brand={{ icon: <ReceiptIcon className="size-4" />, name: "Expenses", sub: "Chalet · Innovations · Personal" }}
      nav={[
        { key: "expenses", label: "Expenses", icon: ListIcon },
        { key: "spending", label: "Spending", icon: ChartColumnIcon },
        { key: "recurring", label: "Recurring", icon: RepeatIcon },
        { key: "lists", label: "Lists", icon: TagsIcon, soon: true },
      ]}
      footer={[{ key: "settings", label: "Settings", icon: SettingsIcon }]}
      active={active}
      onNavigate={setActive}
      title={long ? "Maintenance log" : titles[active]}
      period={<Button variant="outline" className="h-9 gap-1 px-2 text-[15px] font-semibold">2026<ChevronDownIcon className="text-muted-foreground" /></Button>}
      headerRight={<><Button variant="outline" size="sm" onClick={() => setLong((l) => !l)}>{long ? "Short title" : "Long title (55)"}</Button><ThemeToggle /></>}
      headerAction={active === "spending" ? { label: "Upload statement", icon: UploadIcon, onClick: () => {} } : undefined}
      primaryAction={{ label: "Add receipt", icon: CameraIcon, onClick: () => setAdding(true) }}
    >
      {active === "expenses" ? <ExpensesPage onAdd={() => setAdding(true)} />
        : <Empty title={`${titles[active]} is a demo stub`} detail="Spending shows the one header action on a phone." />}
      <AddDialog open={adding} onOpenChange={setAdding} />
    </Shell>
  )
}
