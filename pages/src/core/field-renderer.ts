// ============================================================
// GlyphStream — Field Renderer
// Converts brightness field values to ASCII characters
// and renders them to DOM or Canvas.
// ============================================================

import type { BrightnessLookupEntry, GridConfig, ColorConfig, FontConfig, RenderOptions } from './types'
import type { BrightnessField } from './brightness-field'
import { BrightnessField as BrightnessFieldClass } from './brightness-field'
import { gradientColor, paletteColor, colorWithAlpha, parseColor } from '../utils/color'
import { resolveElement, resolveCanvas, getContext2d, clearChildren, createDiv } from '../utils/dom'

// --- DOM Renderer ---

interface RowNodes {
  propNode: HTMLDivElement
  monoNode: HTMLDivElement
}

export class DomRenderer {
  private container: HTMLElement
  private artBox: HTMLDivElement
  private propBox: HTMLDivElement
  private monoBox: HTMLDivElement
  private rows: RowNodes[] = []

  private grid: GridConfig
  private colors: ColorConfig
  private font: FontConfig
  private monoFontFamily?: string
  private monoTint?: string

  constructor(
    containerRef: string | HTMLElement,
    grid: GridConfig,
    colors: ColorConfig,
    font: FontConfig,
    options?: { monoFontFamily?: string; monoTint?: string; rowClass?: string; boxClass?: string },
  ) {
    this.container = resolveElement(containerRef)
    this.grid = grid
    this.colors = colors
    this.font = font
    this.monoFontFamily = options?.monoFontFamily
    this.monoTint = options?.monoTint

    const lineHeight = font.lineHeight ?? (font.fontSize + 2)
    const rowClass = options?.rowClass ?? 'gs-art-row'
    const boxClass = options?.boxClass ?? 'gs-art-box'

    // Build DOM structure
    this.artBox = createDiv(boxClass)
    this.propBox = createDiv('gs-prop-box')
    this.monoBox = createDiv('gs-mono-box')

    // Apply styles
    Object.assign(this.artBox.style, {
      width: '100%',
      overflow: 'hidden',
      borderRadius: '10px',
      padding: '14px',
      background: 'rgba(0,0,0,0.4)',
      boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.05)',
    })

    for (const box of [this.propBox, this.monoBox]) {
      Object.assign(box.style, {
        width: '100%',
        overflow: 'hidden',
      })
    }

    // Monospace font styling
    if (this.monoFontFamily) {
      Object.assign(this.monoBox.style, {
        fontFamily: `"${this.monoFontFamily}", monospace`,
        fontSize: `${font.fontSize}px`,
        lineHeight: `${lineHeight}px`,
        color: this.monoTint ?? 'rgba(130,155,210,0.7)',
      })
    }

    this.artBox.appendChild(this.propBox)
    if (this.monoFontFamily) {
      this.artBox.appendChild(this.monoBox)
    }
    this.container.appendChild(this.artBox)

    // Create row elements
    for (let row = 0; row < grid.rows; row++) {
      const propRow = document.createElement('div')
      propRow.className = rowClass
      Object.assign(propRow.style, {
        display: 'block',
        width: 'fit-content',
        marginInline: 'auto',
        whiteSpace: 'pre',
        fontFamily: `"${font.fontFamily}", serif`,
        fontSize: `${font.fontSize}px`,
        lineHeight: `${lineHeight}px`,
        height: `${lineHeight}px`,
      })
      this.propBox.appendChild(propRow)

      const monoRow = document.createElement('div')
      monoRow.className = rowClass
      Object.assign(monoRow.style, {
        display: 'block',
        width: 'fit-content',
        marginInline: 'auto',
        whiteSpace: 'pre',
        fontFamily: this.monoFontFamily ? `"${this.monoFontFamily}", monospace` : 'monospace',
        fontSize: `${font.fontSize}px`,
        lineHeight: `${lineHeight}px`,
        height: `${lineHeight}px`,
      })
      this.monoBox.appendChild(monoRow)

      this.rows.push({ propNode: propRow, monoNode: monoRow })
    }
  }

  /** Render the brightness field to DOM rows. */
  render(
    field: BrightnessFieldClass,
    lookup: BrightnessLookupEntry[],
    time?: number,
  ): void {
    const { cols, rows, oversample = 2 } = this.grid

    for (let row = 0; row < rows; row++) {
      let propHtml = ''
      let monoText = ''

      for (let col = 0; col < cols; col++) {
        const brightness = field.sampleCell(col, row, oversample)
        const brightnessByte = Math.min(255, Math.floor(brightness * 255))
        const entry = lookup[brightnessByte]!

        // Apply color mode to proportional HTML
        let styledHtml = entry.propHtml
        if (this.colors.mode !== 'monochrome' && entry.propHtml !== ' ') {
          styledHtml = this.applyColorToHtml(entry.propHtml, brightness, time)
        }

        propHtml += styledHtml
        monoText += entry.monoChar
      }

      const rowNodes = this.rows[row]!
      rowNodes.propNode.innerHTML = propHtml
      rowNodes.monoNode.textContent = monoText
    }
  }

  /** Apply color mode to an HTML span string. */
  private applyColorToHtml(html: string, brightness: number, time?: number): string {
    switch (this.colors.mode) {
      case 'gradient': {
        const colors = this.colors.gradientColors ?? ['#ffffff', '#888888']
        const color = gradientColor(colors, brightness)
        // Replace the class-based color with inline style
        return html.replace(
          /<span class="([^"]*)">([^<]*)<\/span>/,
          (_match, classes, char) =>
            `<span class="${classes}" style="color:${color}">${char}</span>`,
        )
      }
      case 'palette': {
        const colors = this.colors.palette ?? ['#ffffff']
        const color = paletteColor(colors, brightness)
        return html.replace(
          /<span class="([^"]*)">([^<]*)<\/span>/,
          (_match, classes, char) =>
            `<span class="${classes}" style="color:${color}">${char}</span>`,
        )
      }
      case 'time': {
        const cycleTime = this.colors.cycleTime ?? 60000
        const t = time !== undefined ? ((time % cycleTime) / cycleTime + brightness) % 1 : brightness
        const colors = this.colors.palette ?? ['#ffffff']
        const color = paletteColor(colors, t)
        return html.replace(
          /<span class="([^"]*)">([^<]*)<\/span>/,
          (_match, classes, char) =>
            `<span class="${classes}" style="color:${color}">${char}</span>`,
        )
      }
      default:
        return html
    }
  }

  /** Clear all DOM content. */
  clear(): void {
    clearChildren(this.container)
  }

  /** Get the art box element. */
  getElement(): HTMLElement {
    return this.artBox
  }
}

// --- Canvas Renderer ---

export class CanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private grid: GridConfig
  private colors: ColorConfig
  private font: FontConfig

  constructor(
    canvasRef: string | HTMLCanvasElement,
    grid: GridConfig,
    colors: ColorConfig,
    font: FontConfig,
  ) {
    this.canvas = resolveCanvas(canvasRef)
    this.ctx = getContext2d(this.canvas)
    this.grid = grid
    this.colors = colors
    this.font = font
  }

  /** Render the brightness field to canvas as ASCII characters. */
  render(
    field: BrightnessFieldClass,
    lookup: BrightnessLookupEntry[],
    time?: number,
  ): void {
    const { cols, rows, oversample = 2 } = this.grid
    const fontSize = this.font.fontSize
    const lineHeight = this.font.lineHeight ?? (fontSize + 2)

    // Clear canvas
    this.ctx.fillStyle = '#0a0a12'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.font = `${fontSize}px "${this.font.fontFamily}", serif`
    this.ctx.textBaseline = 'top'

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const brightness = field.sampleCell(col, row, oversample)
        const brightnessByte = Math.min(255, Math.floor(brightness * 255))
        const entry = lookup[brightnessByte]!

        if (entry.monoChar === ' ') continue

        const x = col * fontSize * 0.6
        const y = row * lineHeight

        // Determine color
        let color: string
        switch (this.colors.mode) {
          case 'gradient': {
            const colors = this.colors.gradientColors ?? ['#ffffff', '#888888']
            color = gradientColor(colors, brightness)
            break
          }
          case 'palette': {
            const colors = this.colors.palette ?? ['#ffffff']
            color = paletteColor(colors, brightness)
            break
          }
          case 'time': {
            const cycleTime = this.colors.cycleTime ?? 60000
            const t = time !== undefined ? ((time % cycleTime) / cycleTime + brightness) % 1 : brightness
            const colors = this.colors.palette ?? ['#ffffff']
            color = paletteColor(colors, t)
            break
          }
          default: {
            const baseColor = this.colors.monochromeColor ?? '#c4a35a'
            color = colorWithAlpha(baseColor, brightness)
          }
        }

        this.ctx.fillStyle = color
        this.ctx.fillText(entry.monoChar, x, y)
      }
    }
  }

  /** Clear the canvas. */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /** Get the canvas element. */
  getElement(): HTMLCanvasElement {
    return this.canvas
  }
}

// --- Factory ---

export type FieldRenderer = DomRenderer | CanvasRenderer

export function createRenderer(
  options: RenderOptions,
  grid: GridConfig,
  colors: ColorConfig,
  font: FontConfig,
  extra?: { monoFontFamily?: string; monoTint?: string; rowClass?: string; boxClass?: string },
): FieldRenderer {
  if (options.target === 'dom') {
    return new DomRenderer(
      options.container,
      grid,
      colors,
      font,
      {
        monoFontFamily: extra?.monoFontFamily,
        monoTint: extra?.monoTint,
        rowClass: extra?.rowClass,
        boxClass: extra?.boxClass,
      },
    )
  }
  return new CanvasRenderer(options.canvas, grid, colors, font)
}
