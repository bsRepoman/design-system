import { defineConfig } from "tsup"

// The theme layer for pages with no bundler: classic scripts, no React, no module syntax.
// Kept out of tsup.config.ts because that one runs with `clean: true`, which would delete
// these; this one runs after it and only adds.
export default defineConfig({
  entry: {
    "theme-preboot": "lib/theme/preboot.ts",
    "theme-vanilla": "lib/theme/vanilla.ts",
  },
  format: ["iife"],
  globalName: "BsTheme",
  minify: true,
  clean: false,
  dts: false,
  sourcemap: false,
  outDir: "dist",
  outExtension: () => ({ js: ".js" }),
})
