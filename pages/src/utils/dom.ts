// ============================================================
// GlyphStream — DOM Utilities
// Element resolution, creation, and cleanup helpers.
// ============================================================

/** Resolve a CSS selector or HTMLElement to a concrete element. */
export function resolveElement(ref: string | HTMLElement): HTMLElement {
  if (typeof ref === 'string') {
    const el = document.querySelector(ref)
    if (!(el instanceof HTMLElement)) {
      throw new Error(`GlyphStream: element "${ref}" not found or not an HTMLElement`)
    }
    return el
  }
  return ref
}

/** Resolve a CSS selector or HTMLCanvasElement to a concrete canvas. */
export function resolveCanvas(ref: string | HTMLCanvasElement): HTMLCanvasElement {
  if (typeof ref === 'string') {
    const el = document.querySelector(ref)
    if (!(el instanceof HTMLCanvasElement)) {
      throw new Error(`GlyphStream: element "${ref}" not found or not an HTMLCanvasElement`)
    }
    return el
  }
  return ref
}

/** Create a div with optional class and styles. */
export function createDiv(className?: string, styles?: Partial<CSSStyleDeclaration>): HTMLDivElement {
  const div = document.createElement('div')
  if (className) div.className = className
  if (styles) {
    Object.assign(div.style, styles)
  }
  return div
}

/** Create a canvas with dimensions and optional class. */
export function createCanvas(
  width: number,
  height: number,
  className?: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  if (className) canvas.className = className
  return canvas
}

/** Get a 2D rendering context with willReadFrequently flag. */
export function getContext2d(
  canvas: HTMLCanvasElement,
  willReadFrequently = false,
): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d', { willReadFrequently })
  if (ctx === null) {
    throw new Error('GlyphStream: failed to get 2D context from canvas')
  }
  return ctx
}

/** Clear all children from an element. */
export function clearChildren(el: HTMLElement): void {
  while (el.firstChild) {
    el.removeChild(el.firstChild)
  }
}

/** Wait for a specific font family to be loaded by the browser. */
export async function waitForFont(fontFamily: string, timeoutMs = 5000): Promise<void> {
  if (document.fonts && document.fonts.ready) {
    await Promise.race([
      document.fonts.ready,
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error(`GlyphStream: font "${fontFamily}" load timeout`)), timeoutMs),
      ),
    ])
  }
  // Also check if the specific font is available
  if (document.fonts && document.fonts.load) {
    const loaded = await document.fonts.load(`400 16px ${fontFamily}`)
    if (loaded.length === 0) {
      console.warn(`GlyphStream: font "${fontFamily}" may not be available`)
    }
  }
}

/** Escape HTML special characters. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Build a CSS font string from family, weight, style, and size. */
export function toCssFont(
  fontFamily: string,
  weight: number,
  style: string,
  fontSize: number,
): string {
  const stylePrefix = style === 'italic' ? 'italic ' : ''
  return `${stylePrefix}${weight} ${fontSize}px ${fontFamily}`
}
