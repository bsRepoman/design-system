/**
 * The Appearance controls for pages with no framework. Builds the same two controls the
 * React apps use (a segmented control for Theme, a swatch radio group for Accent) with
 * the same roles and keys, styled by appearance.css.
 *
 *   BsTheme.mountAppearance(document.getElementById("appearance"), window.__theme)
 */
import { ACCENTS, APPEARANCE_COPY, MODES, type Accent, type Mode, type Theme } from "./runtime"

const SVG = "http://www.w3.org/2000/svg"

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K, cls?: string, attrs: Record<string, string> = {}, text?: string
) {
  const node = document.createElement(tag)
  if (cls) node.className = cls
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  if (text !== undefined) node.textContent = text
  return node
}

function check() {
  const svg = document.createElementNS(SVG, "svg")
  svg.setAttribute("viewBox", "0 0 24 24")
  svg.setAttribute("fill", "none")
  svg.setAttribute("stroke", "currentColor")
  svg.setAttribute("stroke-width", "2")
  svg.setAttribute("stroke-linecap", "round")
  svg.setAttribute("stroke-linejoin", "round")
  svg.setAttribute("class", "bs-check")
  svg.setAttribute("aria-hidden", "true")
  const path = document.createElementNS(SVG, "path")
  path.setAttribute("d", "M20 6 9 17l-5-5")
  svg.appendChild(path)
  return svg
}

export function mountAppearance(root: HTMLElement, theme: Theme) {
  root.replaceChildren()
  root.classList.add("bs-appearance")

  // Theme: a segmented control. Exactly one segment is lit; pressing it again does nothing.
  const themeLabel = el("div", "bs-appearance-label", { id: "bs-theme-label" }, APPEARANCE_COPY.themeLabel)
  const seg = el("div", "bs-segmented", { role: "group", "aria-labelledby": "bs-theme-label" })
  const segButtons = MODES.map((m) => {
    const b = el("button", "bs-segmented-item", { type: "button", "data-value": m.key }, m.label)
    b.addEventListener("click", () => theme.setMode(m.key))
    seg.appendChild(b)
    return b
  })

  // Accent: a real radio group. The option IS the colour, so selection is a ring and a tick.
  const accentLabel = el("div", "bs-appearance-label", { id: "bs-accent-label" }, APPEARANCE_COPY.accentLabel)
  const group = el("div", "bs-radio-group", { role: "radiogroup", "aria-labelledby": "bs-accent-label" })
  const cards = ACCENTS.map((a) => {
    const card = el("button", "bs-radio-card", {
      type: "button", role: "radio", "aria-label": a.label, title: a.label, "data-value": a.key,
    })
    const swatch = el("span", "bs-swatch")
    swatch.style.background = a.swatch
    swatch.appendChild(check())
    card.appendChild(swatch)
    card.addEventListener("click", () => theme.setAccent(a.key))
    group.appendChild(card)
    return card
  })

  // Roving tabindex and arrow keys, as a native radio group has.
  group.addEventListener("keydown", (e) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"]
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const i = cards.findIndex((c) => c.getAttribute("aria-checked") === "true")
    const next = (i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + cards.length) % cards.length
    theme.setAccent(ACCENTS[next].key as Accent)
    cards[next].focus()
  })

  const note = el("p", "bs-appearance-note", {}, APPEARANCE_COPY.footnote)

  const sync = () => {
    const mode: Mode = theme.readMode()
    const accent = theme.readAccent()
    segButtons.forEach((b) => {
      const on = b.dataset.value === mode
      b.setAttribute("aria-pressed", String(on))
      if (on) b.setAttribute("data-pressed", ""); else b.removeAttribute("data-pressed")
    })
    cards.forEach((c) => {
      const on = c.dataset.value === accent
      c.setAttribute("aria-checked", String(on))
      c.tabIndex = on ? 0 : -1
      if (on) c.setAttribute("data-checked", ""); else c.removeAttribute("data-checked")
    })
  }

  const themeBlock = el("div")
  themeBlock.append(themeLabel, seg)
  const accentBlock = el("div")
  accentBlock.append(accentLabel, group, note)
  root.append(themeBlock, accentBlock)

  sync()
  return theme.subscribe(sync)
}

export { ACCENTS, APPEARANCE_COPY, MODES }
