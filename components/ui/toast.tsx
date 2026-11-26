"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { CircleCheckIcon, InfoIcon, OctagonXIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useIsPhone } from "@/hooks/use-phone"

/**
 * Pop-up confirmations, on base-ui's Toast (UX Designer Decisions (57)).
 *
 * Replaces sonner, which injects a `<style>` element and so is blocked by a CSP of
 * `default-src 'self'` (Fortress Decisions 2026-11-26 (1)). base-ui sets its toast
 * variables through React `style` props (CSSOM), which that CSP allows.
 *
 * Use a toast only when the result is not visible where the person is: a save that
 * closes the form, a delete, a batch accept, an upload finishing in the background.
 * Errors the person must fix stay beside the field or in the page's Failed state.
 * Wording: one line, past tense, naming the thing. Reversible actions pass `undo`.
 *
 * `toast` works outside React (an API client, for example) because it talks to one
 * manager that `ToastProvider` renders. Mount `ToastProvider` once, near the root.
 */

const TIMEOUT = 5000
const TIMEOUT_WITH_UNDO = 8000
const LIMIT = 3

const manager = ToastPrimitive.createToastManager()

type ToastKind = "success" | "error" | "info"

interface ToastOptions {
  /** A second line, if one is truly needed. */
  description?: React.ReactNode
  /** Shows an Undo button and keeps the toast up longer. Closing follows the click. */
  undo?: () => void
  /** Reuse an id to replace a toast rather than stack a second one. */
  id?: string
}

function show(type: ToastKind, title: React.ReactNode, options: ToastOptions = {}) {
  const { description, undo, id } = options
  if (id) manager.close(id)
  const toastId = manager.add({
    id,
    type,
    title,
    description,
    timeout: undo ? TIMEOUT_WITH_UNDO : TIMEOUT,
    // Errors are announced assertively; base-ui reads high priority as an alert.
    priority: type === "error" ? "high" : "low",
    actionProps: undo
      ? {
          children: "Undo",
          onClick: () => {
            undo()
            manager.close(toastId)
          },
        }
      : undefined,
  })
  return toastId
}

const toast = {
  success: (title: React.ReactNode, options?: ToastOptions) => show("success", title, options),
  error: (title: React.ReactNode, options?: ToastOptions) => show("error", title, options),
  info: (title: React.ReactNode, options?: ToastOptions) => show("info", title, options),
  /** Closes one toast, or all of them with no id. */
  close: (id?: string) => manager.close(id),
}

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CircleCheckIcon className="size-4 text-positive" />,
  error: <OctagonXIcon className="size-4 text-destructive" />,
  info: <InfoIcon className="size-4 text-info" />,
}

function ToastList({ isPhone }: { isPhone: boolean }) {
  const { toasts } = ToastPrimitive.useToastManager()
  return toasts.map((t) => (
    <ToastPrimitive.Root
      key={t.id}
      toast={t}
      swipeDirection={isPhone ? "down" : ["right", "down"]}
      data-slot="toast"
      className={cn(
        // Each toast sits at the bottom of the viewport and is lifted by the heights of
        // the newer toasts below it (`--toast-offset-y`) plus a gap per position.
        "absolute right-0 bottom-0 left-0 z-[calc(1000-var(--toast-index))] select-none",
        "flex items-start gap-2.5 rounded-xl bg-popover p-3 pr-2 text-popover-foreground",
        "shadow-lg ring-1 ring-foreground/10 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "[transform:translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-var(--toast-offset-y)-var(--toast-index)*0.5rem))]",
        "transition-[transform,opacity] duration-200 ease-out",
        "data-[starting-style]:opacity-0 data-[starting-style]:[transform:translateY(100%)]",
        "data-[ending-style]:opacity-0",
        "data-[limited]:opacity-0"
      )}
    >
      <span className="mt-0.5 shrink-0">{ICONS[(t.type as ToastKind) ?? "info"] ?? ICONS.info}</span>
      <div className="min-w-0 flex-1">
        <ToastPrimitive.Title className="text-sm leading-5 font-medium" />
        <ToastPrimitive.Description className="text-sm leading-5 text-muted-foreground" />
      </div>
      <ToastPrimitive.Action
        className={cn(
          "-my-1 shrink-0 rounded-md px-2 py-1 text-sm font-medium text-foreground",
          "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        )}
      />
      <ToastPrimitive.Close
        aria-label="Dismiss"
        className={cn(
          "-my-1 shrink-0 rounded-md p-1.5 text-muted-foreground",
          "hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        )}
      >
        <XIcon className="size-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  ))
}

/**
 * Renders the toasts. Desktop: bottom-right. Phone: along the bottom, above `Shell`'s
 * floating primary action (bottom-6 + h-13), so it never covers it; swipe down to dismiss.
 * F6 moves focus to the toasts (base-ui).
 */
function ToastProvider({ children }: { children?: React.ReactNode }) {
  const isPhone = useIsPhone()
  return (
    <ToastPrimitive.Provider toastManager={manager} timeout={TIMEOUT} limit={LIMIT}>
      {children}
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport
          data-slot="toast-viewport"
          className={cn(
            "fixed z-50 outline-none",
            isPhone
              ? "right-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] left-3"
              : "right-6 bottom-6 w-90"
          )}
        >
          <ToastList isPhone={isPhone} />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}

export { ToastProvider, toast }
export type { ToastOptions }
