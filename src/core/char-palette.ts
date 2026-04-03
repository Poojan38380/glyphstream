// ============================================================
// GlyphStream — Character Palette Builder
// Measures character width (via pretext) and brightness (via canvas),
// then builds a 256-entry brightness lookup table.
// ============================================================

import { prepareWithSegments } from '@chenglou/pretext'
import type {
  PaletteEntry,
  BrightnessLookupEntry,
  FontVariant,
  FontStyle,
  CharPaletteConfig,
  FontConfig,
  GridConfig,
} from './types'
import { toCssFont, escapeHtml } from '../utils/dom'

// --- Brightness Canvas (shared singleton) ---

let brightnessCanvas: HTMLCanvasElement | null = null
let brightnessCtx: CanvasRenderingContext2D | null = null

function getBrightnessContext(): CanvasRenderingContext2D {
  if (brightnessCtx) return brightnessCtx
  brightnessCanvas = document.createElement('canvas')
  brightnessCanvas.width = 28
  brightnessCanvas.height = 28
  brightnessCtx = brightnessCanvas.getContext('2d', { willReadFrequently: true })
  if (!brightnessCtx) throw new Error('GlyphStream: failed to create brightness canvas context')
  return brightnessCtx
}

/** Estimate character brightness by rendering to a 28×28 canvas and averaging alpha. */
function estimateBrightness(ch: string, font: string): number {
  const ctx = getBrightnessContext()
  const size = 28
  ctx.clearRect(0, 0, size, size)
  ctx.font = font
  ctx.fillStyle = '#fff'
  ctx.textBaseline = 'middle'
  ctx.fillText(ch, 1, size / 2)
  const data = ctx.getImageData(0, 0, size, size).data
  let sum = 0
  for (let i = 3; i < data.length; i += 4) sum += data[i]!
  return sum / (255 * size * size)
}

/** Measure character width using pretext. */
function measureWidth(ch: string, font: string): number {
  const prepared = prepareWithSegments(ch, font)
  return prepared.widths.length > 0 ? prepared.widths[0]! : 0
}

// --- Palette Builder ---

export interface BuildPaletteArgs {
  font: FontConfig
  charPalette: CharPaletteConfig
  grid: GridConfig
  /** Target row width in pixels (used for width error calculation) */
  targetRowWidth: number
}

export interface PaletteResult {
  /** Sorted palette entries (by brightness) */
  palette: PaletteEntry[]
  /** 256-entry brightness lookup table */
  brightnessLookup: BrightnessLookupEntry[]
  /** Target cell width (targetRowWidth / cols) */
  targetCellWidth: number
}

/**
 * Build the full character palette and brightness lookup table.
 *
 * Pipeline:
 * 1. For each font variant (weight × style), measure every character in charset
 * 2. Normalize brightness across all entries
 * 3. Sort by brightness
 * 4. For each of 256 brightness levels, find the best character match
 *    using a combined brightness + width error score
 */
export function buildCharPalette({
  font,
  charPalette,
  grid,
  targetRowWidth,
}: BuildPaletteArgs): PaletteResult {
  const { fontFamily, fontSize, variants = [{ weight: 400, style: 'normal' }] } = font
  const { charset, monoRamp, brightnessWeight = 2.5 } = charPalette
  const { cols } = grid

  const targetCellWidth = targetRowWidth / cols

  // Step 1: Measure every character across all font variants
  const palette: PaletteEntry[] = []

  for (const variant of variants) {
    const fontStr = toCssFont(fontFamily, variant.weight, variant.style, fontSize)
    for (const ch of charset) {
      if (ch === ' ') continue // Skip space — always handled separately
      const width = measureWidth(ch, fontStr)
      if (width <= 0) continue
      const brightness = estimateBrightness(ch, fontStr)
      palette.push({
        char: ch,
        weight: variant.weight,
        style: variant.style,
        font: fontStr,
        width,
        brightness,
      })
    }
  }

  // Step 2: Normalize brightness to 0–1
  if (palette.length > 0) {
    const maxBrightness = Math.max(...palette.map((e) => e.brightness))
    if (maxBrightness > 0) {
      for (let i = 0; i < palette.length; i++) {
        palette[i]!.brightness /= maxBrightness
      }
    }
  }

  // Step 3: Sort by brightness
  palette.sort((a, b) => a.brightness - b.brightness)

  // Step 4: Build 256-entry brightness lookup table
  const brightnessLookup = buildBrightnessLookup(
    palette,
    monoRamp,
    targetCellWidth,
    brightnessWeight,
  )

  return { palette, brightnessLookup, targetCellWidth }
}

/** Build the 256-entry brightness → character lookup table. */
function buildBrightnessLookup(
  palette: PaletteEntry[],
  monoRamp: string,
  targetCellWidth: number,
  brightnessWeight: number,
): BrightnessLookupEntry[] {
  const lookup: BrightnessLookupEntry[] = []

  for (let byte = 0; byte < 256; byte++) {
    const brightness = byte / 255

    // Monospace character from ramp
    const monoIndex = Math.min(monoRamp.length - 1, Math.floor(brightness * monoRamp.length))
    const monoChar = monoRamp[monoIndex]!

    // Very dark → just a space
    if (brightness < 0.03) {
      lookup.push({ monoChar, propHtml: ' ' })
      continue
    }

    // Find best proportional character
    const match = findBestChar(palette, brightness, targetCellWidth, brightnessWeight)
    const alphaIndex = Math.max(1, Math.min(10, Math.round(brightness * 10)))
    const weightClass = weightToClass(match.weight)
    const italicClass = match.style === 'italic' ? ' it' : ''

    lookup.push({
      monoChar,
      propHtml: `<span class="${weightClass}${italicClass} a${alphaIndex}">${escapeHtml(match.char)}</span>`,
    })
  }

  return lookup
}

/** Binary search + local optimization to find the best character for a target brightness. */
function findBestChar(
  palette: PaletteEntry[],
  targetBrightness: number,
  targetCellWidth: number,
  brightnessWeight: number,
): PaletteEntry {
  // Binary search for closest brightness
  let lo = 0
  let hi = palette.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (palette[mid]!.brightness < targetBrightness) lo = mid + 1
    else hi = mid
  }

  // Local optimization window
  let bestScore = Infinity
  let best = palette[lo]!
  const windowSize = 15
  const start = Math.max(0, lo - windowSize)
  const end = Math.min(palette.length, lo + windowSize)

  for (let i = start; i < end; i++) {
    const entry = palette[i]!
    const brightnessError = Math.abs(entry.brightness - targetBrightness) * brightnessWeight
    const widthError = Math.abs(entry.width - targetCellWidth) / targetCellWidth
    const score = brightnessError + widthError
    if (score < bestScore) {
      bestScore = score
      best = entry
    }
  }

  return best
}

/** Convert font weight to CSS class name. */
function weightToClass(weight: number): string {
  if (weight <= 300) return 'w3'
  if (weight <= 500) return 'w5'
  return 'w8'
}

// --- CSS Generation ---

/** Generate the CSS classes needed for proportional rendering. */
export function generatePaletteCss(
  variants: FontVariant[],
  colorPalette: string[],
): string {
  const lines: string[] = []

  // Weight classes
  const weights = new Set(variants.map((v) => v.weight))
  for (const w of weights) {
    const cls = weightToClass(w)
    lines.push(`.${cls} { font-weight: ${w}; }`)
  }

  // Italic class
  if (variants.some((v) => v.style === 'italic')) {
    lines.push('.it { font-style: italic; }')
  }

  // Brightness alpha classes (a1–a10) with palette colors
  if (colorPalette.length > 0) {
    for (let i = 1; i <= 10; i++) {
      const alpha = i / 10
      // Map alpha to a palette color
      const colorIndex = Math.min(colorPalette.length - 1, Math.floor(alpha * colorPalette.length))
      const color = colorPalette[colorIndex]!
      lines.push(`.a${i} { color: ${color}; }`)
    }
  } else {
    // Default gold tones
    for (let i = 1; i <= 10; i++) {
      const alpha = i / 10
      lines.push(`.a${i} { color: rgba(196,163,90,${alpha.toFixed(2)}); }`)
    }
  }

  return lines.join('\n')
}
