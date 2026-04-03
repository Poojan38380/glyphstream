// ============================================================
// GlyphStream — AsciiAmbient Component
// Slow, meditative ASCII art that evolves over time.
// Minimal particle count, gentle forces, long decay times.
// Designed as a living background that breathes.
// ============================================================

import type { ColorConfig, BrightnessLookupEntry } from '../../core/types'
import { ParticleSystem } from '../../core/particle-system'
import { BrightnessField } from '../../core/brightness-field'
import { buildCharPalette } from '../../core/char-palette'
import { DomRenderer } from '../../core/field-renderer'
import { createRng, lerp } from '../../utils/math'
import { clearChildren } from '../../utils/dom'

// --- Presets ---

export interface AmbientPreset {
  name: string
  description: string
  params: Partial<AmbientParams>
}

export const AMBIENT_PRESETS: AmbientPreset[] = [
  {
    name: 'dawn',
    description: 'Warm sunrise tones, gentle breathing motion',
    params: {
      particleCount: 40,
      speed: 0.15,
      decay: 0.97,
      forceMode: 'breathe',
      colorMode: 'dawn',
      palette: ['#ffecd2', '#fcb69f', '#a1c4fd'],
      cycleTime: 60000,
    },
  },
  {
    name: 'dusk',
    description: 'Deep purples and oranges of twilight',
    params: {
      particleCount: 35,
      speed: 0.12,
      decay: 0.96,
      forceMode: 'drift',
      colorMode: 'dusk',
      palette: ['#667eea', '#764ba2', '#f093fb', '#f5576c'],
      cycleTime: 90000,
    },
  },
  {
    name: 'midnight',
    description: 'Cool blues and silvers in deep night',
    params: {
      particleCount: 30,
      speed: 0.1,
      decay: 0.98,
      forceMode: 'gentle',
      colorMode: 'midnight',
      palette: ['#0c3483', '#a2b6df', '#6b8dd6', '#1a1a2e'],
      cycleTime: 120000,
    },
  },
  {
    name: 'breathing',
    description: 'Rhythmic expansion and contraction, like breathing',
    params: {
      particleCount: 50,
      speed: 0.08,
      decay: 0.975,
      forceMode: 'breathe',
      colorMode: 'custom',
      palette: ['#c4a35a', '#e8c96a', '#8b6914'],
      cycleTime: 30000,
    },
  },
  {
    name: 'drift',
    description: 'Slow, aimless wandering — pure ambient noise',
    params: {
      particleCount: 25,
      speed: 0.05,
      decay: 0.99,
      forceMode: 'drift',
      colorMode: 'custom',
      palette: ['#a8edea', '#fed6e3', '#d299c2'],
      cycleTime: 180000,
    },
  },
]

// --- Parameters ---

export type ForceMode = 'gentle' | 'drift' | 'breathe'
export type AmbientColorMode = 'dawn' | 'dusk' | 'midnight' | 'custom'

export interface AmbientParams {
  cols: number
  rows: number
  fontSize: number
  fontFamily: string
  particleCount: number
  speed: number
  decay: number
  forceMode: ForceMode
  charset: string
  monoRamp: string
  colorMode: AmbientColorMode
  palette: string[]
  cycleTime: number
  seed: number
}

export const DEFAULT_PARAMS: AmbientParams = {
  cols: 80,
  rows: 40,
  fontSize: 12,
  fontFamily: 'Georgia, serif',
  particleCount: 40,
  speed: 0.15,
  decay: 0.97,
  forceMode: 'breathe',
  charset: ' .,:;!+-=*#@%&',
  monoRamp: ' .`-_:,;^=+/|)\\!?0oOQ#%@',
  colorMode: 'dawn',
  palette: ['#ffecd2', '#fcb69f', '#a1c4fd'],
  cycleTime: 60000,
  seed: 42,
}

// --- Component ---

export class AsciiAmbient {
  private params: AmbientParams
  private container: HTMLElement

  // Pipeline
  private particleSystem: ParticleSystem | null = null
  private brightnessField: BrightnessField | null = null
  private paletteResult: { brightnessLookup: BrightnessLookupEntry[] } | null = null
  private renderer: DomRenderer | null = null

  // Animation
  private running = false
  private animationId: number | null = null
  private time = 0
  private startTime = 0

  // Simulation space
  private simWidth = 300
  private simHeight = 150

  constructor(containerRef: string | HTMLElement, params: Partial<AmbientParams> = {}) {
    this.container = typeof containerRef === 'string'
      ? document.querySelector(containerRef)! as HTMLElement
      : containerRef

    this.params = { ...DEFAULT_PARAMS, ...params }
    this.build()
  }

  private build(): void {
    const { cols, rows, fontSize, fontFamily, particleCount, decay, charset, monoRamp, seed } = this.params
    const lineHeight = fontSize + 2
    const targetRowWidth = cols * fontSize * 0.6
    const oversample = 2

    // Particle system — gentle, low-energy
    this.particleSystem = new ParticleSystem({
      particleCount,
      canvasWidth: this.simWidth,
      canvasHeight: this.simHeight,
      attractorCount: 1,
      attractorMode: 'circular',
      spriteRadius: 20,
      seed,
    })

    // Brightness field
    this.brightnessField = new BrightnessField({
      fieldCols: cols * oversample,
      fieldRows: rows * oversample,
      decay,
      spriteRadius: 20,
      attractorRadii: [40],
    }, this.simWidth, this.simHeight)

    // Color config
    const colors: ColorConfig = {
      mode: 'palette',
      palette: this.params.palette,
      cycleTime: this.params.cycleTime,
    }

    // Character palette
    this.paletteResult = buildCharPalette({
      font: { fontFamily, fontSize, lineHeight, variants: [{ weight: 400, style: 'normal' }] },
      charPalette: { charset, monoRamp },
      grid: { cols, rows, oversample },
      targetRowWidth,
    })

    // Renderer
    this.renderer = new DomRenderer(
      this.container,
      { cols, rows, oversample },
      colors,
      { fontFamily, fontSize, lineHeight, variants: [{ weight: 400, style: 'normal' }] },
    )
  }

  /** Apply force mode to particles. */
  private applyForces(): void {
    if (!this.particleSystem) return

    const { forceMode, speed } = this.params
    const particles = this.particleSystem.getParticles()
    const attractors = this.particleSystem.getAttractors()
    const t = this.time * 0.001 * speed

    if (attractors.length > 0) {
      const attr = attractors[0]!

      // Move attractor based on force mode
      switch (forceMode) {
        case 'breathe': {
          // Slow circular breathing
          const breathePhase = Math.sin(t * 0.5) * 0.5 + 0.5
          const radius = 40 + breathePhase * 60
          attr.x = this.simWidth / 2 + Math.cos(t * 0.3) * radius
          attr.y = this.simHeight / 2 + Math.sin(t * 0.4) * radius
          attr.force = 0.02 + breathePhase * 0.03
          break
        }
        case 'drift': {
          // Slow random walk
          const rng = createRng(this.params.seed + Math.floor(this.time * 0.01))
          attr.x += (rng.next() - 0.5) * 2
          attr.y += (rng.next() - 0.5) * 2
          // Wrap
          if (attr.x < 0) attr.x += this.simWidth
          if (attr.x > this.simWidth) attr.x -= this.simWidth
          if (attr.y < 0) attr.y += this.simHeight
          if (attr.y > this.simHeight) attr.y -= this.simHeight
          attr.force = 0.015
          break
        }
        case 'gentle': {
          // Fixed center with tiny oscillation
          attr.x = this.simWidth / 2 + Math.sin(t * 0.2) * 20
          attr.y = this.simHeight / 2 + Math.cos(t * 0.15) * 15
          attr.force = 0.01
          break
        }
      }
    }

    // Update particles
    this.particleSystem.updateAttractors(this.time)
    this.particleSystem.updateParticles()

    // Extra gentle damping for ambient feel
    for (const p of particles) {
      p.vx *= 0.98
      p.vy *= 0.98
    }
  }

  private frame = (): void => {
    if (!this.running) return
    this.time++

    if (!this.brightnessField || !this.particleSystem) return

    this.applyForces()
    this.brightnessField.decayField()

    for (const p of this.particleSystem.getParticles()) {
      this.brightnessField.splatParticle(p.x, p.y)
    }

    const attractors = this.particleSystem.getAttractors()
    for (let i = 0; i < attractors.length; i++) {
      const attr = attractors[i]!
      this.brightnessField.splatAttractor(attr.x, attr.y, i)
    }

    if (this.renderer && this.paletteResult) {
      this.renderer.render(this.brightnessField, this.paletteResult.brightnessLookup, this.time)
    }

    this.animationId = requestAnimationFrame(this.frame)
  }

  // --- Public API ---

  start(): void {
    if (this.running) return
    this.running = true
    this.startTime = performance.now()
    this.animationId = requestAnimationFrame(this.frame)
  }

  stop(): void {
    this.running = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  pause(): void { this.stop() }

  resume(): void {
    if (!this.running) this.start()
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
    const preset = AMBIENT_PRESETS.find((p) => p.name === name)
    if (preset) {
      Object.assign(this.params, preset.params)
      this.time = 0
      this.build()
      if (this.running) { this.stop(); this.start() }
    }
  }

  updateParams(partial: Partial<AmbientParams>): void {
    const structuralKeys = new Set([
      'cols', 'rows', 'fontSize', 'fontFamily', 'particleCount',
      'charset', 'monoRamp', 'forceMode', 'seed',
    ])
    const needsRebuild = Object.keys(partial).some((k) => structuralKeys.has(k))

    Object.assign(this.params, partial)

    if (needsRebuild) {
      this.time = 0
      this.build()
      if (this.running) { this.stop(); this.start() }
      return
    }

    if (this.brightnessField && partial.decay !== undefined) {
      this.brightnessField.setDecay(partial.decay)
    }
    if (partial.palette !== undefined && this.renderer) {
      const r = this.renderer as any
      if (r.colors) {
        r.colors.palette = partial.palette
      }
    }
    if (partial.cycleTime !== undefined && this.renderer) {
      const r = this.renderer as any
      if (r.colors) {
        r.colors.cycleTime = partial.cycleTime
      }
    }
  }

  getElement(): HTMLElement { return this.container }
  isRunning(): boolean { return this.running }
  getParams(): AmbientParams { return { ...this.params } }
  getPresets(): AmbientPreset[] { return AMBIENT_PRESETS }
}
