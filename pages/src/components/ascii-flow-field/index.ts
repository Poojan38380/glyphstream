// ============================================================
// GlyphStream — AsciiFlowField Component
// Perlin noise flow field rendered as ASCII art.
// Particles follow vector forces, accumulating into organic
// density maps rendered as characters.
// ============================================================

import type {
  ColorConfig,
  BrightnessLookupEntry,
} from '../../core/types'
import { ParticleSystem } from '../../core/particle-system'
import { BrightnessField } from '../../core/brightness-field'
import { buildCharPalette } from '../../core/char-palette'
import { DomRenderer } from '../../core/field-renderer'
import { ValueNoise2D } from '../../utils/math'

// --- Presets ---

export interface FlowFieldPreset {
  name: string
  description: string
  params: Partial<FlowFieldParams>
}

export const FLOW_FIELD_PRESETS: FlowFieldPreset[] = [
  {
    name: 'calm',
    description: 'Gentle, slow-moving flow with soft transitions',
    params: { noiseScale: 0.003, noiseOctaves: 2, particleSpeed: 0.4, particleCount: 400, decay: 0.94 },
  },
  {
    name: 'turbulent',
    description: 'Chaotic, high-energy flow with sharp direction changes',
    params: { noiseScale: 0.008, noiseOctaves: 5, particleSpeed: 1.2, particleCount: 1200, decay: 0.88 },
  },
  {
    name: 'spiral',
    description: 'Rotational flow creating spiral patterns',
    params: { noiseScale: 0.005, noiseOctaves: 3, particleSpeed: 0.7, particleCount: 600, decay: 0.92, flowMode: 'spiral' },
  },
  {
    name: 'waves',
    description: 'Sinusoidal wave patterns moving across the field',
    params: { noiseScale: 0.004, noiseOctaves: 2, particleSpeed: 0.5, particleCount: 500, decay: 0.93, flowMode: 'waves' },
  },
  {
    name: 'static-art',
    description: 'Frozen flow field — no animation, just organic texture',
    params: { noiseScale: 0.006, noiseOctaves: 4, particleSpeed: 0, particleCount: 800, decay: 1.0 },
  },
]

// --- Parameters ---

export interface FlowFieldParams {
  cols: number
  rows: number
  fontSize: number
  fontFamily: string
  particleCount: number
  noiseScale: number
  noiseOctaves: number
  particleSpeed: number
  decay: number
  charset: string
  monoRamp: string
  flowMode: 'noise' | 'spiral' | 'waves'
  colorMode: 'monochrome' | 'gradient' | 'palette'
  monochromeColor: string
  gradientColors: string[]
  palette: string[]
  seed: number
}

export const DEFAULT_PARAMS: FlowFieldParams = {
  cols: 70,
  rows: 35,
  fontSize: 13,
  fontFamily: 'Georgia, serif',
  particleCount: 600,
  noiseScale: 0.005,
  noiseOctaves: 3,
  particleSpeed: 0.6,
  decay: 0.92,
  charset: ' .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  monoRamp: ' .`-_:,;^=+/|)\\!?0oOQ#%@',
  flowMode: 'noise',
  colorMode: 'monochrome',
  monochromeColor: '#c4a35a',
  gradientColors: ['#c4a35a', '#4a3520'],
  palette: ['#c4a35a', '#e8c96a', '#8b6914', '#4a3520', '#1a0a00'],
  seed: 42,
}

// --- Component ---

export class AsciiFlowField {
  private params: FlowFieldParams
  private container: HTMLElement

  // Pipeline
  private particleSystem: ParticleSystem | null = null
  private brightnessField: BrightnessField | null = null
  private paletteResult: { brightnessLookup: BrightnessLookupEntry[] } | null = null
  private renderer: DomRenderer | null = null
  private noise: ValueNoise2D | null = null

  // Animation
  private running = false
  private animationId: number | null = null
  private time = 0

  // Simulation space (fixed so DOM doesn't shift)
  private simWidth = 240
  private simHeight = 120

  constructor(containerRef: string | HTMLElement, params: Partial<FlowFieldParams> = {}) {
    this.container = typeof containerRef === 'string'
      ? document.querySelector(containerRef)! as HTMLElement
      : containerRef

    this.params = { ...DEFAULT_PARAMS, ...params }
    this.noise = new ValueNoise2D(this.params.seed)
    this.build()
  }

  /** Build the entire pipeline from current params. */
  private build(): void {
    const { cols, rows, fontSize, fontFamily, particleCount, decay, charset, monoRamp, seed } = this.params
    const lineHeight = fontSize + 2
    const targetRowWidth = cols * fontSize * 0.6
    const oversample = 2

    // Noise
    this.noise = new ValueNoise2D(seed)

    // Particle system
    this.particleSystem = new ParticleSystem({
      particleCount,
      canvasWidth: this.simWidth,
      canvasHeight: this.simHeight,
      attractorCount: 0,
      attractorMode: 'fixed',
      spriteRadius: 6,
      seed,
    })

    // Brightness field
    this.brightnessField = new BrightnessField({
      fieldCols: cols * oversample,
      fieldRows: rows * oversample,
      decay,
      spriteRadius: 6,
      attractorRadii: [],
    }, this.simWidth, this.simHeight)

    // Color config
    const colors: ColorConfig = {
      mode: this.params.colorMode === 'monochrome' ? 'monochrome'
        : this.params.colorMode === 'gradient' ? 'gradient'
        : 'palette',
      monochromeColor: this.params.monochromeColor,
      gradientColors: this.params.gradientColors,
      palette: this.params.palette,
    }

    // Character palette
    this.paletteResult = buildCharPalette({
      font: { fontFamily, fontSize, lineHeight, variants: [{ weight: 400, style: 'normal' }] },
      charPalette: { charset, monoRamp },
      grid: { cols, rows, oversample },
      targetRowWidth,
    })

    // Renderer — clear old DOM first
    this.container.innerHTML = ''
    this.renderer = new DomRenderer(
      this.container,
      { cols, rows, oversample },
      colors,
      { fontFamily, fontSize, lineHeight, variants: [{ weight: 400, style: 'normal' }] },
    )
  }

  /** Get the flow vector at a given position. */
  private getFlow(x: number, y: number, time: number): { fx: number; fy: number } {
    const { noiseScale, noiseOctaves, flowMode } = this.params
    const t = time * 0.0001

    if (flowMode === 'spiral') {
      const cx = this.simWidth / 2
      const cy = this.simHeight / 2
      const dx = x - cx
      const dy = y - cy
      const angle = Math.atan2(dy, dx) + t * 2
      const noiseVal = this.noise!.fbm(x * noiseScale, y * noiseScale, noiseOctaves)
      return { fx: Math.cos(angle) * 0.5 + noiseVal * 0.3, fy: Math.sin(angle) * 0.5 + noiseVal * 0.3 }
    }

    if (flowMode === 'waves') {
      const waveX = Math.sin(y * 0.02 + t * 3) * 0.5
      const waveY = Math.cos(x * 0.02 + t * 2) * 0.5
      const noiseVal = this.noise!.fbm(x * noiseScale, y * noiseScale, noiseOctaves)
      return { fx: waveX + noiseVal * 0.3, fy: waveY + noiseVal * 0.3 }
    }

    const angle = this.noise!.fbm(x * noiseScale, y * noiseScale, noiseOctaves, 2.0, 0.5) * Math.PI * 2
    return { fx: Math.cos(angle), fy: Math.sin(angle) }
  }

  /** Single simulation step. */
  private step(): void {
    if (!this.particleSystem || !this.brightnessField) return

    const { particleSpeed } = this.params
    const particles = this.particleSystem.getParticles()

    for (const p of particles) {
      const flow = this.getFlow(p.x, p.y, this.time)
      p.vx += flow.fx * particleSpeed * 0.1
      p.vy += flow.fy * particleSpeed * 0.1
      p.vx *= 0.95
      p.vy *= 0.95
      p.x += p.vx
      p.y += p.vy

      if (p.x < 0) p.x += this.simWidth
      if (p.x >= this.simWidth) p.x -= this.simWidth
      if (p.y < 0) p.y += this.simHeight
      if (p.y >= this.simHeight) p.y -= this.simHeight
    }

    this.brightnessField.decayField()
    for (const p of particles) {
      this.brightnessField.splatParticle(p.x, p.y)
    }
  }

  /** Render current state to DOM. */
  private render(): void {
    if (!this.renderer || !this.brightnessField || !this.paletteResult) return
    this.renderer.render(this.brightnessField, this.paletteResult.brightnessLookup, this.time)
  }

  /** Animation frame loop. */
  private frame = (): void => {
    if (!this.running) return
    this.time++
    this.step()
    this.render()
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
    this.container.innerHTML = ''
  }

  /** Full rebuild with new seed. */
  regenerate(seed: number): void {
    this.params.seed = seed
    this.time = 0
    this.build()
    if (this.running) {
      this.stop()
      this.start()
    }
  }

  /** Apply a named preset (full rebuild). */
  setPreset(name: string): void {
    const preset = FLOW_FIELD_PRESETS.find((p) => p.name === name)
    if (preset) {
      Object.assign(this.params, preset.params)
      this.time = 0
      this.build()
      if (this.running) { this.stop(); this.start() }
    }
  }

  /**
   * Partially update parameters.
   * "live" params (speed, decay, noiseScale, noiseOctaves, flowMode, color)
   * update without rebuild. "structural" params (cols, rows, fontSize, fontFamily,
   * particleCount, charset, monoRamp) trigger a full rebuild.
   */
  updateParams(partial: Partial<FlowFieldParams>): void {
    const structuralKeys = new Set(['cols', 'rows', 'fontSize', 'fontFamily', 'particleCount', 'charset', 'monoRamp', 'seed'])
    const needsRebuild = Object.keys(partial).some((k) => structuralKeys.has(k))

    Object.assign(this.params, partial)

    if (needsRebuild) {
      this.time = 0
      this.build()
      if (this.running) { this.stop(); this.start() }
      return
    }

    // Live updates — no rebuild needed
    if (this.brightnessField && partial.decay !== undefined) {
      this.brightnessField.setDecay(partial.decay)
    }
    if (partial.noiseScale !== undefined || partial.noiseOctaves !== undefined) {
      // Noise params are read per-frame, no action needed
    }
    if (partial.flowMode !== undefined) {
      // Flow mode is read per-frame, no action needed
    }
    if (partial.particleSpeed !== undefined) {
      // Speed is read per-frame, no action needed
    }
    if (partial.colorMode !== undefined || partial.monochromeColor !== undefined || partial.gradientColors !== undefined || partial.palette !== undefined) {
      // Color is applied during render via the renderer's color config
      // Update renderer colors directly
      if (this.renderer) {
        const r = this.renderer as any
        if (r.colors) {
          r.colors.mode = this.params.colorMode === 'monochrome' ? 'monochrome'
            : this.params.colorMode === 'gradient' ? 'gradient' : 'palette'
          r.colors.monochromeColor = this.params.monochromeColor
          r.colors.gradientColors = this.params.gradientColors
          r.colors.palette = this.params.palette
        }
      }
    }
  }

  getElement(): HTMLElement { return this.container }
  isRunning(): boolean { return this.running }
  getParams(): FlowFieldParams { return { ...this.params } }
  getPresets(): FlowFieldPreset[] { return FLOW_FIELD_PRESETS }
}
