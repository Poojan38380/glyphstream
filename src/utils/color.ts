// ============================================================
// GlyphStream — Color Utilities
// Parsing, interpolation, and palette mapping.
// ============================================================

interface RGB {
  r: number
  g: number
  b: number
}

/** Parse a CSS hex color (#rgb, #rrggbb) into RGB components (0–255). */
export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '')
  if (h.length === 3) {
    return {
      r: parseInt(h[0]! + h[0]!, 16),
      g: parseInt(h[1]! + h[1]!, 16),
      b: parseInt(h[2]! + h[2]!, 16),
    }
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

/** Convert RGB (0–255) to CSS hex string. */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Linear interpolation between two RGB colors. t is 0–1. */
export function lerpColor(a: string, b: string, t: number): string {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return rgbToHex(
    ca.r + (cb.r - ca.r) * t,
    ca.g + (cb.g - ca.g) * t,
    ca.b + (cb.b - ca.b) * t,
  )
}

/** Interpolate across a gradient of colors at position t (0–1). */
export function gradientColor(colors: string[], t: number): string {
  if (colors.length < 2) return colors[0] ?? '#000000'
  if (colors.length === 2) return lerpColor(colors[0]!, colors[1]!, t)

  const clampedT = Math.max(0, Math.min(1, t))
  const segment = clampedT * (colors.length - 1)
  const index = Math.floor(segment)
  const localT = segment - index

  if (index >= colors.length - 1) return colors[colors.length - 1]!
  return lerpColor(colors[index]!, colors[index + 1]!, localT)
}

/** Map a brightness value (0–1) to a palette color index. */
export function paletteColor(palette: string[], brightness: number): string {
  if (palette.length === 0) return '#ffffff'
  if (palette.length === 1) return palette[0]!
  const index = Math.min(palette.length - 1, Math.floor(brightness * palette.length))
  return palette[index]!
}

/** Build an alpha-based CSS color string from a base color and brightness. */
export function colorWithAlpha(color: string, alpha: number): string {
  const { r, g, b } = hexToRgb(color)
  const clampedAlpha = Math.max(0, Math.min(1, alpha))
  return `rgba(${r},${g},${b},${clampedAlpha.toFixed(2)})`
}

/** Generate n evenly-spaced colors around the HSL wheel. */
export function hslWheelColors(n: number, saturation = 70, lightness = 55): string[] {
  const colors: string[] = []
  for (let i = 0; i < n; i++) {
    const hue = (i * 360) / n
    colors.push(hslToHex(hue, saturation, lightness))
  }
  return colors
}

/** Convert HSL to hex color. */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

/** Parse any CSS color string to RGB. Falls back to white. */
export function parseColor(color: string): RGB {
  if (color.startsWith('#')) return hexToRgb(color)

  // Handle rgb/rgba
  const rgbaMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]!, 10),
      g: parseInt(rgbaMatch[2]!, 10),
      b: parseInt(rgbaMatch[3]!, 10),
    }
  }

  // Named color fallback — use a canvas to resolve
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
    const data = ctx.getImageData(0, 0, 1, 1).data
    return { r: data[0]!, g: data[1]!, b: data[2]! }
  }

  return { r: 255, g: 255, b: 255 }
}
