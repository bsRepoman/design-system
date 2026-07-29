// Extracts the design tokens out of app/globals.css into two shippable
// artifacts: dist/tokens.css (raw :root/.dark custom properties, for any
// consumer — including ones with no Tailwind, like LegoDB's static site)
// and dist/theme.css (tokens.css plus the Tailwind v4 @theme inline
// mapping, for Tailwind v4 consumers like the Jarvis dashboard).
//
// The [data-preset]/[data-color] theme-lab blocks and the @layer base
// reset in globals.css are demo-only and deliberately excluded — they're
// not part of the design system's contract with consumers.

import { mkdirSync, readFileSync, writeFileSync } from "fs"

const SOURCE = "app/globals.css"
const OUT_DIR = "dist"

function extractBlock(source, selector) {
  const start = source.indexOf(`${selector} {`)
  if (start === -1) {
    throw new Error(`Could not find "${selector} {" in ${SOURCE}`)
  }
  const braceOpen = source.indexOf("{", start)
  let depth = 0
  let i = braceOpen
  for (; i < source.length; i++) {
    if (source[i] === "{") depth++
    if (source[i] === "}") {
      depth--
      if (depth === 0) break
    }
  }
  return source.slice(start, i + 1)
}

const source = readFileSync(SOURCE, "utf8")

const rootBlock = extractBlock(source, ":root")
const darkBlock = extractBlock(source, ".dark")

// --font-geist-sans/--font-geist-mono only exist in apps that load Geist via
// next/font. A consumer without that (e.g. a Vite app) would otherwise see
// these resolve to nothing and silently fall back to the browser's serif
// default — the exact bug fixed earlier in this repo's own globals.css.
// Add a generic fallback so an unset variable degrades gracefully instead.
const themeInlineBlock = extractBlock(source, "@theme inline")
  .replace(
    "var(--font-geist-sans)",
    "var(--font-geist-sans, ui-sans-serif, system-ui, sans-serif)"
  )
  .replace(
    "var(--font-geist-mono)",
    "var(--font-geist-mono, ui-monospace, monospace)"
  )

mkdirSync(OUT_DIR, { recursive: true })

const tokensCss = `/* Generated from ${SOURCE} by scripts/build-tokens.mjs. Do not edit directly. */\n\n${rootBlock}\n\n${darkBlock}\n`
writeFileSync(`${OUT_DIR}/tokens.css`, tokensCss)

const themeCss = `/* Generated from ${SOURCE} by scripts/build-tokens.mjs. Do not edit directly. */\n\n@import "./tokens.css";\n\n@custom-variant dark (&:is(.dark *));\n\n${themeInlineBlock}\n`
writeFileSync(`${OUT_DIR}/theme.css`, themeCss)

console.log(`Wrote ${OUT_DIR}/tokens.css and ${OUT_DIR}/theme.css`)
