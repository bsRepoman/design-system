"use client"

import * as React from "react"
import { PaletteIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const presets = [
  { value: "nova", label: "Nova", hint: "Geist · default corners" },
  { value: "vega", label: "Vega", hint: "Inter · sharper corners" },
  { value: "luma", label: "Luma", hint: "Inter · pill-shaped" },
  { value: "rhea", label: "Rhea", hint: "Inter · rounded" },
] as const

const colors = [
  { value: "neutral", label: "Neutral", swatch: "oklch(0.205 0 0)" },
  { value: "blue", label: "Blue", swatch: "oklch(0.55 0.19 258)" },
  { value: "green", label: "Green", swatch: "oklch(0.55 0.16 150)" },
  { value: "violet", label: "Violet", swatch: "oklch(0.55 0.2 300)" },
  { value: "rose", label: "Rose", swatch: "oklch(0.55 0.21 20)" },
] as const

export function ThemeLab() {
  const [preset, setPreset] = React.useState<string>("nova")
  const [color, setColor] = React.useState<string>("neutral")

  React.useEffect(() => {
    document.documentElement.setAttribute("data-preset", preset)
  }, [preset])

  React.useEffect(() => {
    document.documentElement.setAttribute("data-color", color)
  }, [color])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="icon">
            <PaletteIcon className="size-4" />
            <span className="sr-only">Theme lab</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Corners &amp; font</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuRadioGroup value={preset} onValueChange={setPreset}>
          {presets.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              <div className="flex flex-col">
                <span>{item.label}</span>
                <span className="text-xs text-muted-foreground">
                  {item.hint}
                </span>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel>Color</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuRadioGroup value={color} onValueChange={setColor}>
          {colors.map((item) => (
            <DropdownMenuRadioItem key={item.value} value={item.value}>
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: item.swatch }}
              />
              {item.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
