/**
 * The framework-free theme runtime: which accent and which light/dark mode an app is in,
 * where that choice is remembered, and how it reaches the page.
 *
 * Shared by every consumer on purpose. React apps use it through `useAppearance`; a
 * static page with no bundler loads it as a classic script (`theme-preboot.js` runs it
 * before first paint, `theme-vanilla.js` adds the Appearance controls). One source means
 * the accent list, the storage keys and the dark-mode rule cannot drift between apps.
 *
 * Appearance is per app, deliberately: each app owns its own accent so it stays
 * distinguishable from the others at a glance. The `prefix` namespaces the storage keys.
 */

export const ACCENTS = [
  { key: "neutral", label: "Neutral", swatch: "oklch(0.205 0 0)" },
  { key: "blue", label: "Blue", swatch: "oklch(0.55 0.19 258)" },
  { key: "green", label: "Green", swatch: "oklch(0.55 0.16 150)" },
  { key: "violet", label: "Violet", swatch: "oklch(0.55 0.2 300)" },
  // Rose is deliberately absent: hue 20 against --destructive at 27 makes a primary
  // button and a delete warning indistinguishable in a swatch. (The design system's
  // tokens still define it for theme-lab; it is simply not offered to users.)
] as const

export type Accent = (typeof ACCENTS)[number]["key"]
export type Mode = "light" | "dark" | "system"

export const MODES: readonly { key: Mode; label: string }[] = [
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "system", label: "System" },
]

/** The words on the Appearance card, so every app says the same thing. */
export const APPEARANCE_COPY = {
  heading: "Appearance",
  description:
    "Set per app, on purpose — so this one stays recognisable next to the others. Remembered in this browser.",
  themeLabel: "Theme",
  accentLabel: "Accent",
  footnote:
    "Surfaces stay neutral grey under every accent — that is the design system's choice, not a limitation. A tinted background costs legibility on a page this dense.",
} as const

export interface ThemeOptions {
  /** Namespaces the storage keys: `<prefix>.accent` and `<prefix>.mode`. */
  prefix: string
  /** An older key that held only light/dark (no "system"). Read once, then superseded. */
  legacyModeKey?: string
}

const isAccent = (v: unknown): v is Accent => ACCENTS.some((a) => a.key === v)
const isMode = (v: unknown): v is Mode => v === "light" || v === "dark" || v === "system"

export function createTheme({ prefix, legacyModeKey }: ThemeOptions) {
  const K_ACCENT = `${prefix}.accent`
  const K_MODE = `${prefix}.mode`

  // Private windows make the storage accessor itself throw, and an app that cannot render
  // is worse than one that forgets a preference.
  const read = (key: string): string | null => {
    try { return localStorage.getItem(key) } catch { return null }
  }
  const write = (key: string, value: string) => {
    try { localStorage.setItem(key, value) } catch { /* nothing to do */ }
  }

  const readAccent = (): Accent => {
    const v = read(K_ACCENT)
    return isAccent(v) ? v : "neutral"
  }

  const readMode = (): Mode => {
    const v = read(K_MODE)
    if (isMode(v)) return v
    // Migrate: an explicit light/dark made before "system" existed carries over.
    const old = legacyModeKey ? read(legacyModeKey) : null
    return old === "light" || old === "dark" ? old : "system"
  }

  const isDark = (mode: Mode) =>
    mode === "dark" ||
    (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  const apply = (accent: Accent, mode: Mode) => {
    const html = document.documentElement
    const dark = isDark(mode)
    html.setAttribute("data-color", accent)
    html.classList.toggle("dark", dark)
    html.style.colorScheme = dark ? "dark" : "light"
  }

  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())

  const setAccent = (a: Accent) => { write(K_ACCENT, a); apply(a, readMode()); emit() }
  const setMode = (m: Mode) => { write(K_MODE, m); apply(readAccent(), m); emit() }

  /** "System" has to keep tracking the OS after the page has loaded. */
  const watchSystem = () => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const on = () => { if (readMode() === "system") apply(readAccent(), "system") }
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }

  /** Apply the stored choice and keep following the OS. Safe to call before first paint. */
  const init = () => {
    apply(readAccent(), readMode())
    return watchSystem()
  }

  const subscribe = (l: () => void) => {
    listeners.add(l)
    return () => { listeners.delete(l) }
  }

  return { readAccent, readMode, apply, setAccent, setMode, watchSystem, init, subscribe }
}

export type Theme = ReturnType<typeof createTheme>
