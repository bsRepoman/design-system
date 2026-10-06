import * as React from "react"

import type { Accent, Mode, Theme } from "./runtime"

/** The current accent and mode for a theme, re-rendering when either changes. */
export function useAppearance(theme: Theme) {
  const [state, setState] = React.useState(() => ({
    accent: theme.readAccent(),
    mode: theme.readMode(),
  }))

  React.useEffect(
    () => theme.subscribe(() => setState({ accent: theme.readAccent(), mode: theme.readMode() })),
    [theme]
  )

  return {
    ...state,
    setAccent: (a: Accent) => theme.setAccent(a),
    setMode: (m: Mode) => theme.setMode(m),
  }
}
