"use client"

import * as React from "react"
import { BellIcon, MenuIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar"
import { useIsPhone } from "@/hooks/use-phone"
import { cn } from "@/lib/utils"

/**
 * The app frame every app shares, promoted from PBJ Chalet and the App Starter, which each
 * kept a copy (UX Designer Decisions (48), (54), (55)).
 *
 * Desktop: the collapsible Sidebar, and a 56px top bar with the page title, an optional
 * period control, page chrome, the primary action and the reserved notification bell.
 *
 * Below 480px the bar IS the page header: a 44px menu button, the title at 22px, at most one
 * period control, at most one `headerAction` as a 44px icon button, and the bell. Anything
 * else (`headerRight`) moves to the page's first line, and so does the period when the row
 * can't fit (55). The nav opens full screen (54), and the `primaryAction` floats bottom
 * right (48). A page drops its own card title there; `useShellPhone()` tells it when.
 */
type ShellNavItem = {
  key: string
  label: string
  icon: React.ElementType
  /** A surface that exists in the plan and not yet in the app: shown, marked, inert.
   *  Hiding it would make the app look finished when it is not. */
  soon?: boolean
}

type ShellAction = { label: string; icon: React.ElementType; onClick: () => void }

type ShellProps = {
  brand: { icon: React.ReactNode; name: string; sub?: string; navKey?: string }
  nav: ShellNavItem[]
  /** Settings and the like, at the foot of the nav. */
  footer?: ShellNavItem[]
  active: string
  onNavigate: (key: string) => void
  title: string
  period?: React.ReactNode
  /** Page-level chrome (sync state, a secondary control): the top bar on a desktop, the
   *  page's first line on a phone. */
  headerRight?: React.ReactNode
  /** The page's one header action: a labelled button on a desktop, a 44px icon button on
   *  a phone. */
  headerAction?: ShellAction
  /** Opt-in, for the app's one primary task only, one per page: in the top bar on a
   *  desktop, floating bottom right on a phone (48). */
  primaryAction?: ShellAction
  children: React.ReactNode
}

const ShellPhoneContext = React.createContext(false)

/** True when the shell is in its phone layout, so a page can drop its card's title row. */
function useShellPhone() {
  return React.useContext(ShellPhoneContext)
}

function Shell(props: ShellProps) {
  const isPhone = useIsPhone()
  return (
    <ShellPhoneContext.Provider value={isPhone}>
      <SidebarProvider style={{ "--shell-header": isPhone ? "3.75rem" : "3.5rem" } as React.CSSProperties}>
        {isPhone ? <PhoneFrame {...props} /> : <DesktopFrame {...props} />}
      </SidebarProvider>
    </ShellPhoneContext.Provider>
  )
}

/* ---------------------------------------------------------------------------------- */

/** Separate from the frame because useSidebar() only resolves below SidebarProvider. */
function DesktopNav({ brand, nav, footer = [], active, onNavigate }: ShellProps) {
  const { setOpenMobile } = useSidebar()
  const go = (k: string) => { setOpenMobile(false); onNavigate(k) }
  const item = (i: ShellNavItem) => (
    <SidebarMenuItem key={i.key}>
      {/* aria-disabled, not disabled: SidebarMenuButton renders through useRender and drops
          a `disabled` prop, while its own styles key off aria-disabled. */}
      <SidebarMenuButton isActive={i.key === active} tooltip={i.label}
                         aria-disabled={i.soon || undefined}
                         onClick={i.soon ? undefined : () => go(i.key)}>
        <i.icon />
        <span>{i.label}</span>
      </SidebarMenuButton>
      {i.soon && (
        <SidebarMenuBadge className="text-[10px] tracking-wide text-muted-foreground uppercase">soon</SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  )
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-auto py-1.5" onClick={() => go(brand.navKey ?? nav[0]?.key ?? "")}>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                {brand.icon}
              </span>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-semibold">{brand.name}</span>
                {brand.sub && <span className="truncate text-xs font-normal text-muted-foreground">{brand.sub}</span>}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{nav.map(item)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {footer.length > 0 && (
        <SidebarFooter>
          <SidebarMenu>{footer.map(item)}</SidebarMenu>
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  )
}

function Bell({ className }: { className?: string }) {
  // Reserved for the Task and Notification System. Inert until it exists: the dashed border
  // is what says "reserved" rather than "broken".
  return (
    <Button variant="outline" size="icon" disabled aria-label="Notifications — not yet available"
            className={cn("shrink-0 border-dashed text-muted-foreground/60", className)}>
      <BellIcon />
    </Button>
  )
}

function DesktopFrame(props: ShellProps) {
  const { title, period, headerRight, headerAction, primaryAction, children } = props
  return (
    <>
      <DesktopNav {...props} />
      {/* min-w-0: without it the inset's min-width is its content's, and a wide table
          refuses to shrink into the space left of the sidebar. */}
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-border
                           bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium">{title}</span>
          {period}
          <div className="ml-auto flex min-w-0 items-center gap-3">
            {headerRight}
            {headerAction && (
              <Button variant="outline" onClick={headerAction.onClick}>
                <headerAction.icon />{headerAction.label}
              </Button>
            )}
            {primaryAction && (
              <Button onClick={primaryAction.onClick}>
                <primaryAction.icon />{primaryAction.label}
              </Button>
            )}
            <Bell />
          </div>
        </header>
        <div className="min-w-0 flex-1 p-6">{children}</div>
      </SidebarInset>
    </>
  )
}

/* ---------------------------------------------------------------------------------- */

function PhoneFrame(props: ShellProps) {
  const { title, period, headerRight, headerAction, primaryAction, children } = props
  const [navOpen, setNavOpen] = React.useState(false)
  const header = React.useRef<HTMLElement>(null)
  const periodBox = React.useRef<HTMLSpanElement>(null)
  const spacer = React.useRef<HTMLSpanElement>(null)
  const periodWidth = React.useRef(0)
  const [periodDrops, setPeriodDrops] = React.useState(false)

  // (55): the header measures itself. If the period doesn't fit, it leads the page's first
  // line instead; it comes back when the spare room would hold it again. The title, action
  // and bell never shrink or move.
  React.useLayoutEffect(() => {
    const h = header.current
    if (!h || !period) return
    const check = () => {
      if (!periodDrops) {
        if (h.scrollWidth > h.clientWidth + 0.5) {
          periodWidth.current = (periodBox.current?.offsetWidth ?? 0) + 4
          setPeriodDrops(true)
        }
      } else if ((spacer.current?.offsetWidth ?? 0) >= periodWidth.current) {
        setPeriodDrops(false)
      }
    }
    check()
    const ro = new ResizeObserver(check)
    ro.observe(h)
    return () => ro.disconnect()
  }, [period, periodDrops, title, headerAction])

  const firstLine = (periodDrops && period) || headerRight
  return (
    <>
      <SidebarInset className="min-w-0">
        <header ref={header}
                className="sticky top-0 z-20 flex h-15 shrink-0 items-center gap-1 overflow-hidden border-b border-border
                           bg-background/95 py-2 pr-2 pl-1 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button variant="ghost" size="icon" aria-label="Open navigation" aria-expanded={navOpen}
                  onClick={() => setNavOpen(true)} className="size-11 shrink-0 [&_svg:not([class*='size-'])]:size-[22px]">
            <MenuIcon />
          </Button>
          <h1 className="ml-0.5 shrink-0 text-[22px] leading-none font-semibold tracking-tight whitespace-nowrap">{title}</h1>
          {period && !periodDrops && <span ref={periodBox} className="ml-1.5 shrink-0">{period}</span>}
          <span ref={spacer} className="min-w-0 flex-1" />
          {headerAction && (
            <Button variant="ghost" size="icon" aria-label={headerAction.label} onClick={headerAction.onClick}
                    className="size-11 shrink-0 [&_svg:not([class*='size-'])]:size-[22px]">
              <headerAction.icon />
            </Button>
          )}
          <Bell className="size-10" />
        </header>
        {firstLine && (
          <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
            {periodDrops && period}
            {headerRight}
          </div>
        )}
        {/* Room under the content for the floating action, so it never covers the last row. */}
        <div className={cn("min-w-0 flex-1 p-3", primaryAction && "pb-24")}>{children}</div>
      </SidebarInset>

      {primaryAction && (
        <Button onClick={primaryAction.onClick}
                className="fixed right-4 bottom-6 z-30 h-13 rounded-full px-5 text-[15px] shadow-lg [&_svg:not([class*='size-'])]:size-5">
          <primaryAction.icon />{primaryAction.label}
        </Button>
      )}

      <PhoneNav {...props} open={navOpen} onOpenChange={setNavOpen} />
    </>
  )
}

/** (54): the nav fills the screen on a phone. 52px rows, 18px labels, the close button where
 *  the menu button was, the footer items at the foot; choosing a surface closes it. */
function PhoneNav({ brand, nav, footer = [], active, onNavigate, open, onOpenChange }:
  ShellProps & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const go = (k: string) => { onOpenChange(false); onNavigate(k) }
  const row = (i: ShellNavItem) => (
    <li key={i.key}>
      <button type="button" disabled={i.soon} aria-current={i.key === active ? "page" : undefined}
              onClick={() => go(i.key)}
              className={cn("flex h-13 w-full items-center gap-3.5 rounded-lg px-3.5 text-left text-lg",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            i.key === active ? "bg-sidebar-accent font-semibold" : "hover:bg-sidebar-accent/60",
                            i.soon && "text-muted-foreground")}>
        <i.icon className="size-[22px] shrink-0" strokeWidth={1.75} />
        <span className="flex-1">{i.label}</span>
        {i.soon && <span className="text-[11px] tracking-wider text-muted-foreground uppercase">soon</span>}
      </button>
    </li>
  )
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" showCloseButton={false}
                    className="gap-0 bg-sidebar p-0 text-sidebar-foreground data-[side=left]:w-full data-[side=left]:max-w-none
                               data-[side=left]:border-r-0 data-[side=left]:sm:max-w-none">
        <div className="flex items-center gap-2.5 border-b border-sidebar-border py-2 pr-2 pl-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            {brand.icon}
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <SheetTitle className="truncate text-[17px] font-semibold">{brand.name}</SheetTitle>
            {brand.sub && <div className="truncate text-[13px] text-muted-foreground">{brand.sub}</div>}
          </div>
          <Button variant="ghost" size="icon" aria-label="Close navigation" onClick={() => onOpenChange(false)}
                  className="size-11 shrink-0 [&_svg:not([class*='size-'])]:size-[22px]">
            <XIcon />
          </Button>
        </div>
        <nav aria-label="Main" className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <ul className="flex flex-col gap-0.5 p-2">{nav.map(row)}</ul>
          {footer.length > 0 && (
            <ul className="mt-auto flex flex-col gap-0.5 border-t border-sidebar-border p-2 pb-5">{footer.map(row)}</ul>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

export { Shell, useShellPhone, useIsPhone }
export type { ShellProps, ShellNavItem, ShellAction }
