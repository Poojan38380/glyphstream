// ============================================================
// GlyphStream — AsciiTypography Component
// Particle-driven ASCII art with variable font weights & styles.
// Direct evolution of pretext's variable-typographic-ascii demo.
// Supports proportional + monospace side-by-side rendering.
// ============================================================

import type { ColorConfig, BrightnessLookupEntry, FontStyle } from '../../core/types'
import { ParticleSystem } from '../../core/particle-system'
import { BrightnessField } from '../../core/brightness-field'
import { buildCharPalette, generatePaletteCss } from '../../core/char-palette'
import { DomRenderer } from '../../core/field-renderer'
import { createDiv, clearChildren } from '../../utils/dom'

// --- Presets ---

export interface TypographyPreset {
  name: string
  description: string
  params: Partial<TypographyParams>
}

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  {
    name: 'classic',
    description: 'Georgia 3 weights × normal/italic — the original pretext demo',
    params: {
      fontFamily: 'Georgia, Palatino, "Times New Roman", serif',
      weights: [300, 500, 800],
      styles: ['normal', 'italic'],
      particleCount: 120,
      attractorCount: 2,
      attractorMode: 'lissajous',
      colorPalette: ['#c4a35a', '#e8c96a', '#8b6914'],
      monoTint: 'rgba(130,155,210,0.7)',
    },
  },
  {
    name: 'bold-italic',
    description: 'Heavy italicized typography with dramatic contrast',
    params: {
      fontFamily: 'Georgia, serif',
      weights: [700, 900],
      styles: ['italic'],
      particleCount: 150,
      attractorCount: 2,
      attractorMode: 'lissajous',
      colorPalette: ['#ffffff', '#cccccc', '#888888'],
      monoTint: 'rgba(200,200,200,0.6)',
    },
  },
  {
    name: 'minimal',
    description: 'Single weight, no italic, clean and sparse',
    params: {
      fontFamily: 'Georgia, serif',
      weights: [400],
      styles: ['normal'],
      particleCount: 60,
      attractorCount: 1,
      attractorMode: 'circular',
      colorPalette: ['#c4a35a'],
      monoTint: 'rgba(130,155,210,0.5)',
    },
  },
  {
    name: 'rainbow',
    description: 'Full color palette across the spectrum',
    params: {
      fontFamily: 'Georgia, serif',
      weights: [300, 500, 800],
      styles: ['normal', 'italic'],
      particleCount: 200,
      attractorCount: 3,
      attractorMode: 'lissajous',
      colorPalette: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6'],
      monoTint: 'rgba(130,155,210,0.7)',
    },
  },
  {
    name: 'monochrome-only',
    description: 'No proportional font — just monospace ASCII',
    params: {
      fontFamily: 'Georgia, serif',
      weights: [400],
      styles: ['normal'],
      particleCount: 100,
      attractorCount: 2,
      attractorMode: 'lissajous',
      colorPalette: ['#ffffff'],
      monoTint: 'rgba(255,255,255,0.7)',
      showProp: false,
    },
  },
]

// --- Parameters ---

export interface TypographyParams {
  cols: number
  rows: number
  fontSize: number
  fontFamily: string
  weights: number[]
  styles: FontStyle[]
  particleCount: number
  attractorCount: number
  attractorMode: 'lissajous' | 'circular' | 'random' | 'fixed'
  decay: number
  colorPalette: string[]
  monoTint: string
  monoFontFamily: string
  showSource: boolean
  showProp: boolean
  showMono: boolean
  seed: number
}

export const DEFAULT_PARAMS: TypographyParams = {
  cols: 50,
  rows: 28,
  fontSize: 14,
  fontFamily: 'Georgia, Palatino, "Times New Roman", serif',
  weights: [300, 500, 800],
  styles: ['normal', 'italic'],
  particleCount: 120,
  attractorCount: 2,
  attractorMode: 'lissajous',
  decay: 0.82,
  colorPalette: ['#c4a35a', '#e8c96a', '#8b6914'],
  monoTint: 'rgba(130,155,210,0.7)',
  monoFontFamily: 'Courier New, monospace',
  showSource: true,
  showProp: true,
  showMono: true,
  seed: 42,
}

// --- Component ---

export class AsciiTypography {
  private params: TypographyParams
  private container: HTMLElement

  // Pipeline
  private particleSystem: ParticleSystem | null = null
  private brightnessField: BrightnessField | null = null
  private paletteResult: { brightnessLookup: BrightnessLookupEntry[] } | null = null
  private renderer: DomRenderer | null = null

  // Source canvas (particle simulation visualization)
  private sourceCanvas: HTMLCanvasElement | null = null
  private sourceCtx: CanvasRenderingContext2D | null = null

  // DOM panels
  private propBox: HTMLDivElement | null = null
  private monoBox: HTMLDivElement | null = null
  private sourceBox: HTMLDivElement | null = null

  // Animation
  private running = false
  private animationId: number | null = null
  private time = 0

  // Simulation space
  private simWidth = 220
  private simHeight = 100

  constructor(containerRef: string | HTMLElement, params: Partial<TypographyParams> = {}) {
    this.container = typeof containerRef === 'string'
      ? document.querySelector(containerRef)! as HTMLElement
      : containerRef

    this.params = { ...DEFAULT_PARAMS, ...params }
    this.build()
  }

  private build(): void {
    const { cols, rows, fontSize, fontFamily, weights, styles, particleCount, attractorCount, attractorMode, decay, colorPalette, monoFontFamily, monoTint, showSource, showProp, showMono, seed } = this.params

    const lineHeight = fontSize + 2
    const targetRowWidth = cols * fontSize * 0.6
    const oversample = 2

    // Clear DOM
    clearChildren(this.container)

    // Build layout
    const layout = createDiv('gs-typo-layout')
    Object.assign(layout.style, {
      display: 'flex',
      gap: '20px',
      flexWrap: 'wrap',
      justifyContent: 'center',
    })

    // Source panel
    if (showSource) {
      this.sourceBox = createDiv('gs-panel')
      Object.assign(this.sourceBox.style, {
        flex: '0 0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      })
      const sourceLabel = document.createElement('div')
      sourceLabel.textContent = 'Source Field'
      Object.assign(sourceLabel.style, {
        fontSize: '10px',
        fontWeight: '600',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: '8px',
      })
      this.sourceBox.appendChild(sourceLabel)

      this.sourceCanvas = document.createElement('canvas')
      this.sourceCanvas.width = this.simWidth
      this.sourceCanvas.height = this.simHeight
      Object.assign(this.sourceCanvas.style, {
        width: '100%',
        maxWidth: '260px',
        borderRadius: '6px',
        border: '1px solid rgba(255,255,255,0.05)',
      })
      this.sourceCtx = this.sourceCanvas.getContext('2d', { willReadFrequently: true })
      this.sourceBox.appendChild(this.sourceCanvas)
      layout.appendChild(this.sourceBox)
    }

    // Proportional panel
    if (showProp) {
      this.propBox = createDiv('gs-panel')
      Object.assign(this.propBox.style, {
        flex: '1 1 300px',
        maxWidth: '500px',
      })
      const propLabel = document.createElement('div')
      propLabel.textContent = `Proportional × ${weights.length} Weights${styles.includes('italic') ? ' × Italic' : ''}`
      Object.assign(propLabel.style, {
        fontSize: '10px',
        fontWeight: '600',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: '8px',
      })
      this.propBox.appendChild(propLabel)
      layout.appendChild(this.propBox)
    }

    // Monospace panel
    if (showMono) {
      this.monoBox = createDiv('gs-panel')
      Object.assign(this.monoBox.style, {
        flex: '1 1 300px',
        maxWidth: '500px',
      })
      const monoLabel = document.createElement('div')
      monoLabel.textContent = 'Monospace'
      Object.assign(monoLabel.style, {
        fontSize: '10px',
        fontWeight: '600',
        color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: '8px',
      })
      this.monoBox.appendChild(monoLabel)
      layout.appendChild(this.monoBox)
    }

    this.container.appendChild(layout)

    // Build variants list
    const variants = weights.flatMap((w) => styles.map((s) => ({ weight: w, style: s })))

    // Particle system
    this.particleSystem = new ParticleSystem({
      particleCount,
      canvasWidth: this.simWidth,
      canvasHeight: this.simHeight,
      attractorCount,
      attractorMode,
      spriteRadius: 14,
      seed,
    })

    // Brightness field
    this.brightnessField = new BrightnessField({
      fieldCols: cols * oversample,
      fieldRows: rows * oversample,
      decay,
      spriteRadius: 14,
      attractorRadii: [30, 12, 20, 25],
    }, this.simWidth, this.simHeight)

    // Color config
    const colors: ColorConfig = {
      mode: colorPalette.length > 1 ? 'palette' : 'monochrome',
      palette: colorPalette,
      monochromeColor: colorPalette[0],
    }

    // Character palette
    this.paletteResult = buildCharPalette({
      font: { fontFamily, fontSize, lineHeight, variants },
      charPalette: {
        charset: ' .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        monoRamp: ' .`-_:,;^=+/|)\\!?0oOQ#%@',
      },
      grid: { cols, rows, oversample },
      targetRowWidth,
    })

    // Inject palette CSS
    if (!document.getElementById('gs-typo-palette-css')) {
      const styleEl = document.createElement('style')
      styleEl.id = 'gs-typo-palette-css'
      styleEl.textContent = generatePaletteCss(variants, colorPalette)
      document.head.appendChild(styleEl)
    }

    // Renderer (proportional)
    if (this.propBox) {
      this.renderer = new DomRenderer(
        this.propBox,
        { cols, rows, oversample },
        colors,
        { fontFamily, fontSize, lineHeight, variants },
        { monoFontFamily, monoTint },
      )
    }
  }

  /** Render source canvas (particle simulation visualization). */
  private renderSource(): void {
    if (!this.sourceCtx || !this.sourceCanvas || !this.particleSystem) return
    const ctx = this.sourceCtx
    const w = this.simWidth
    const h = this.simHeight

    // Fade
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(0, 0, w, h)

    // Draw particles
    ctx.globalCompositeOperation = 'lighter'
    const sprite = this.particleSystem.getParticleSprite()
    for (const p of this.particleSystem.getParticles()) {
      ctx.drawImage(sprite, p.x - 14, p.y - 14)
    }

    // Draw attractors
    const attractors = this.particleSystem.getAttractors()
    for (let i = 0; i < attractors.length; i++) {
      const attr = attractors[i]!
      const attrSprite = this.particleSystem.getAttractorSprite(i)
      ctx.drawImage(attrSprite, attr.x - attr.radius, attr.y - attr.radius)
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  /** Single simulation step. */
  private step(): void {
    if (!this.particleSystem || !this.brightnessField) return

    this.particleSystem.updateAttractors(this.time)
    this.particleSystem.updateParticles()
    this.brightnessField.decayField()

    for (const p of this.particleSystem.getParticles()) {
      this.brightnessField.splatParticle(p.x, p.y)
    }

    const attractors = this.particleSystem.getAttractors()
    for (let i = 0; i < attractors.length; i++) {
      const attr = attractors[i]!
      this.brightnessField.splatAttractor(attr.x, attr.y, i)
    }
  }

  private frame = (): void => {
    if (!this.running) return
    this.time++
    this.step()
    this.renderSource()
    if (this.renderer && this.brightnessField && this.paletteResult) {
      this.renderer.render(this.brightnessField, this.paletteResult.brightnessLookup, this.time)
    }
    this.animationId = requestAnimationFrame(this.frame)
  }

  // --- Public API ---

  start(): void {
    if (this.running) return
    this.running = true
    this.animationId = requestAnimationFrame(this.frame)
  }

  stop(): void {
    this.running = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  dispose(): void {
    this.stop()
    clearChildren(this.container)
  }

  regenerate(seed: number): void {
    this.params.seed = seed
    this.time = 0
    this.build()
    if (this.running) { this.stop(); this.start() }
  }

  setPreset(name: string): void {
    const preset = TYPOGRAPHY_PRESETS.find((p) => p.name === name)
    if (preset) {
      Object.assign(this.params, preset.params)
      this.time = 0
      this.build()
      if (this.running) { this.stop(); this.start() }
    }
  }

  updateParams(partial: Partial<TypographyParams>): void {
    const structuralKeys = new Set([
      'cols', 'rows', 'fontSize', 'fontFamily', 'weights', 'styles',
      'particleCount', 'attractorCount', 'attractorMode', 'charset',
      'showSource', 'showProp', 'showMono', 'seed',
    ])
    const needsRebuild = Object.keys(partial).some((k) => structuralKeys.has(k))

    Object.assign(this.params, partial)

    if (needsRebuild) {
      this.time = 0
      this.build()
      if (this.running) { this.stop(); this.start() }
      return
    }

    // Live updates
    if (this.brightnessField && partial.decay !== undefined) {
      this.brightnessField.setDecay(partial.decay)
    }
    if (partial.monoTint !== undefined && this.monoBox) {
      this.monoBox.style.color = partial.monoTint
    }
    if (partial.colorPalette !== undefined && this.renderer) {
      const r = this.renderer as any
      if (r.colors) {
        r.colors.palette = partial.colorPalette
        r.colors.mode = partial.colorPalette.length > 1 ? 'palette' : 'monochrome'
        r.colors.monochromeColor = partial.colorPalette[0]
      }
    }
  }

  getElement(): HTMLElement { return this.container }
  isRunning(): boolean { return this.running }
  getParams(): TypographyParams { return { ...this.params } }
  getPresets(): TypographyPreset[] { return TYPOGRAPHY_PRESETS }
}
