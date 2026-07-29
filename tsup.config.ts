import { readdirSync } from "fs"
import { defineConfig } from "tsup"

const componentEntries = Object.fromEntries(
  readdirSync("components/ui")
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => [file.replace(".tsx", ""), `components/ui/${file}`])
)

export default defineConfig({
  entry: {
    index: "components/ui/index.ts",
    ...componentEntries,
    utils: "lib/utils.ts",
  },
  format: ["esm", "cjs"],
  dts: {
    compilerOptions: {
      incremental: false,
    },
  },
  splitting: true,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  external: [
    "react",
    "react-dom",
    "@base-ui/react",
    "class-variance-authority",
    "lucide-react",
    "clsx",
    "tailwind-merge",
    "next-themes",
    "sonner",
  ],
  banner: {
    js: '"use client"',
  },
})
