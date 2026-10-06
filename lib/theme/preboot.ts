/**
 * Classic script, loaded in <head> before the stylesheets, so the right accent and
 * light/dark are on <html> before first paint. A theme decided after load flashes the
 * wrong one first.
 *
 *   <script src="/theme-preboot.js" data-prefix="legodb" data-legacy-mode-key="legodb-theme"></script>
 */
import { createTheme } from "./runtime"

const el = document.currentScript as HTMLScriptElement | null
const prefix = el?.dataset.prefix
if (prefix) {
  const theme = createTheme({ prefix, legacyModeKey: el?.dataset.legacyModeKey })
  try { theme.init() } catch { /* an app that cannot theme is still an app */ }
  ;(window as unknown as { __theme: unknown }).__theme = theme
}
