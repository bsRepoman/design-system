import * as React from "react"

/** The phone breakpoint, below which the shell, DataTable and Combobox change shape
 *  (UX Designer Decisions (48), (49), (51), (54)). Distinct from the sidebar's 768px
 *  `useIsMobile`, which only decides when the sidebar becomes a drawer. */
export const PHONE_BREAKPOINT = 480

/** The narrower of the window and the screen. A phone browser widens its layout viewport
 *  to fit content wider than the screen, so `innerWidth` alone can report 542px on a 375px
 *  phone when the desktop layout rendered first -- and the phone layout then never comes.
 *  Measured 2026-11-25 in the showcase. The screen's width is the device's, whatever the
 *  content; on a desktop the window is the narrower of the two. */
function width() {
  return Math.min(window.innerWidth, window.screen?.width || Infinity)
}

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback)
  window.addEventListener("orientationchange", callback)
  return () => {
    window.removeEventListener("resize", callback)
    window.removeEventListener("orientationchange", callback)
  }
}

function getSnapshot() {
  return width() < PHONE_BREAKPOINT
}

function getServerSnapshot() {
  return false
}

export function useIsPhone() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
