"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  ArrowUpRightIcon,
  BellIcon,
  PlusIcon,
  UsersIcon,
  ActivityIcon,
  FolderKanbanIcon,
  TrendingUpIcon,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppSidebar } from "@/components/app-sidebar"
import { ThemeLab } from "@/components/theme-lab"
import { ThemeToggle } from "@/components/theme-toggle"

const stats = [
  {
    label: "Team members",
    value: "24",
    change: "+3 this month",
    icon: UsersIcon,
  },
  {
    label: "Active projects",
    value: "12",
    change: "+2 this month",
    icon: FolderKanbanIcon,
  },
  {
    label: "Tasks completed",
    value: "318",
    change: "+18% vs last month",
    icon: ActivityIcon,
  },
  {
    label: "Avg. velocity",
    value: "42 pts",
    change: "+6 pts",
    icon: TrendingUpIcon,
  },
]

type Member = {
  name: string
  email: string
  role: string
  status: "Active" | "Invited" | "Away"
}

const initialMembers: Member[] = [
  { name: "Ava Chen", email: "ava@acme.dev", role: "Engineering", status: "Active" },
  { name: "Marcus Lee", email: "marcus@acme.dev", role: "Design", status: "Active" },
  { name: "Priya Nair", email: "priya@acme.dev", role: "Product", status: "Away" },
  { name: "Diego Santos", email: "diego@acme.dev", role: "Engineering", status: "Invited" },
]

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function statusVariant(status: Member["status"]) {
  if (status === "Active") return "default"
  if (status === "Invited") return "secondary"
  return "outline"
}

const revenue = [
  { month: "Jan", realised: 1934, booked: 0, prior: 2364 },
  { month: "Feb", realised: 3797, booked: 0, prior: 3387 },
  { month: "Mar", realised: 1400, booked: 0, prior: 410 },
  { month: "Apr", realised: 556, booked: 0, prior: 1063 },
  { month: "May", realised: 2363, booked: 0, prior: 1880 },
  { month: "Jun", realised: 1775, booked: 0, prior: 1893 },
  { month: "Jul", realised: 4760, booked: 0, prior: 2276 },
  { month: "Aug", realised: 6282, booked: 0, prior: 4544 },
  { month: "Sep", realised: 0, booked: 2217, prior: 785 },
  { month: "Oct", realised: 0, booked: 1912, prior: 3199 },
  { month: "Nov", realised: 0, booked: 890, prior: 2153 },
  { month: "Dec", realised: 0, booked: 0, prior: 2183 },
]

// `realised` and `booked` share a stack; `prior` gets its own, so it renders
// beside the stack rather than inside it. That grouped-and-stacked shape is the
// one a revenue chart actually needs.
const revenueConfig = {
  realised: { label: "Realised", color: "var(--chart-1)" },
  booked: { label: "Booked", color: "var(--chart-2)" },
  prior: { label: "Prior year", color: "var(--chart-4)" },
}

export default function Home() {
  const [members, setMembers] = React.useState<Member[]>(initialMembers)
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState("")

  function handleAddMember(event: React.FormEvent) {
    event.preventDefault()
    if (!name || !email || !role) {
      toast.error("Fill out every field before adding a member.")
      return
    }

    setMembers((prev) => [
      ...prev,
      { name, email, role, status: "Invited" },
    ])
    toast.success(`Invited ${name} to the team`)
    setName("")
    setEmail("")
    setRole("")
    setOpen(false)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium">Dashboard</span>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <BellIcon className="size-4" />
              <span className="sr-only">Notifications</span>
            </Button>

            <ThemeLab />
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="h-8 gap-2 px-2">
                    <Avatar className="size-6">
                      <AvatarImage src="" alt="Jaime" />
                      <AvatarFallback>JB</AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm sm:inline">Jaime</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="w-full flex-1 space-y-8 px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              An overview of your team&apos;s activity this month.
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={
                <Button>
                  <PlusIcon className="size-4" />
                  Add member
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleAddMember}>
                <DialogHeader>
                  <DialogTitle>Add team member</DialogTitle>
                  <DialogDescription>
                    Invite someone new to Acme Team. They&apos;ll get an email
                    with instructions to join.
                  </DialogDescription>
                </DialogHeader>

                <FieldGroup className="py-4">
                  <Field>
                    <FieldLabel htmlFor="member-name">Full name</FieldLabel>
                    <FieldContent>
                      <Input
                        id="member-name"
                        placeholder="Jordan Rivera"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="member-email">Email</FieldLabel>
                    <FieldContent>
                      <Input
                        id="member-email"
                        type="email"
                        placeholder="jordan@acme.dev"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="member-role">Team</FieldLabel>
                    <FieldContent>
                      <Select
                        value={role}
                        onValueChange={(value) => setRole(value ?? "")}
                      >
                        <SelectTrigger id="member-role" className="w-full">
                          <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Engineering">Engineering</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="Product">Product</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldContent>
                  </Field>
                </FieldGroup>

                <DialogFooter>
                  <DialogClose
                    render={
                      <Button variant="outline" type="button">
                        Cancel
                      </Button>
                    }
                  />
                  <Button type="submit">Send invite</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-3xl">{stat.value}</CardTitle>
                <CardAction>
                  <stat.icon className="size-5 text-muted-foreground" />
                </CardAction>
              </CardHeader>
              <CardFooter>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowUpRightIcon className="size-3 text-emerald-500" />
                  {stat.change}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
            <CardDescription>
              Realised and booked stacked together, against the prior year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="h-[260px] w-full">
              <BarChart data={revenue} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tickFormatter={(v) => `$${v.toLocaleString()}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="realised" stackId="a" fill="var(--color-realised)" radius={2} maxBarSize={22} isAnimationActive={false} />
                <Bar dataKey="booked" stackId="a" fill="var(--color-booked)" radius={2} maxBarSize={22} isAnimationActive={false} />
                <Bar dataKey="prior" stackId="b" fill="var(--color-prior)" radius={2} maxBarSize={22} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Tabs defaultValue="team">
          <TabsList>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>Team members</CardTitle>
                <CardDescription>
                  Everyone with access to this workspace.
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.email}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback>
                                {initials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium leading-none">
                                {member.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{member.role}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(member.status)}>
                            {member.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
                <CardDescription>
                  Nothing wired up here yet — swap in real data whenever
                  you&apos;re ready.
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
