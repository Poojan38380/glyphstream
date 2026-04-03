// ============================================================
// GlyphStream — AsciiReactive Component
// ASCII art driven by user input — mouse, click, scroll, or audio.
// The brightness field responds to interactive forces.
// ============================================================

import type { ColorConfig, BrightnessLookupEntry } from '../../core/types'
import { BrightnessField } from '../../core/brightness-field'
import { buildCharPalette } from '../../core/char-palette'
import { DomRenderer } from '../../core/field-renderer'
import { createDiv, clearChildren } from '../../utils/dom'

// --- Presets ---

export interface ReactivePreset {
  name: string
  description: string
  params: Partial<ReactiveParams>
}

export const REACTIVE_PRESETS: ReactivePreset[] = [
  {
    name: 'paintbrush',
    description: 'Smooth mouse-follow brush strokes',
    params: {
      inputMode: 'mouse',
      brushSize: 8,
      brushIntensity: 0.5,
      decay: 0.95,
      colorMode: 'velocity',
    },
  },
  {
    name: 'ripple',
    description: 'Click to create expanding ripple effects',
    params: {
      inputMode: 'click',
      brushSize: 12,
      brushIntensity: 0.8,
      decay: 0.93,
      colorMode: 'palette',
    },
  },
  {
    name: 'audio-viz',
    description: 'Reactive to microphone audio input',
    params: {
      inputMode: 'audio',
      brushSize: 4,
      brushIntensity: 0.6,
      decay: 0.9,
      colorMode: 'palette',
      audioSensitivity: 0.8,
    },
  },
  {
    name: 'scroll-reveal',
    description: 'Scroll to paint across the canvas',
    params: {
      inputMode: 'scroll',
      brushSize: 10,
      brushIntensity: 0.4,
      decay: 0.96,
      colorMode: 'position',
    },
  },
  {
    name: 'magnetic',
    description: 'Particles attracted to cursor position',
    params: {
      inputMode: 'mouse',
      brushSize: 20,
      brushIntensity: 0.3,
      decay: 0.97,
      colorMode: 'palette',
    },
  },
]

// --- Parameters ---

export type InputMode = 'mouse' | 'click' | 'scroll' | 'audio' | 'custom'
export type ReactiveColorMode = 'velocity' | 'position' | 'time' | 'palette'

export interface ReactiveParams {
  cols: number
  rows: number
  fontSize: number
  fontFamily: string
  inputMode: InputMode
  brushSize: number
  brushIntensity: number
  decay: number
  charset: string
  monoRamp: string
  colorMode: ReactiveColorMode
  palette: string[]
  audioSensitivity: number
  seed: number
}

export const DEFAULT_PARAMS: ReactiveParams = {
  cols: 80,
  rows: 40,
  fontSize: 12,
  fontFamily: 'Courier New, monospace',
  inputMode: 'mouse',
  brushSize: 8,
  brushIntensity: 0.5,
  decay: 0.95,
  charset: ' .,:;!+-=*#@%&abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  monoRamp: ' .`-_:,;^=+/|)\\!?0oOQ#%@',
  colorMode: 'velocity',
  palette: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'],
  audioSensitivity: 0.8,
  seed: 42,
}

// --- Component ---

export class AsciiReactive {
  private params: ReactiveParams
  private container: HTMLElement

  // Pipeline
  private brightnessField: BrightnessField | null = null
  private paletteResult: { brightnessLookup: BrightnessLookupEntry[] } | null = null
  private renderer: DomRenderer | null = null

  // Input tracking
  private mouseX = 0
  private mouseY = 0
  private mouseVx = 0
  private mouseVy = 0
  private lastMouseX = 0
  private lastMouseY = 0
  private mouseDown = false
  private scrollAccum = 0

  // Audio
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private audioData: Uint8Array | null = null
  private audioStream: MediaStream | null = null

  // Custom data source
  private customDataSource: (() => number[][]) | null = null

  // Animation
  private running = false
  private animationId: number | null = null
  private time = 0

  // Event handlers (for cleanup)
  private boundMouseMove: ((e: MouseEvent) => void) | null = null
  private boundMouseDown: ((e: MouseEvent) => void) | null = null
  private boundMouseUp: (() => void) | null = null
  private boundWheel: ((e: WheelEvent) => void) | null = null
  private boundClick: ((e: MouseEvent) => void) | null = null

  constructor(containerRef: string | HTMLElement, params: Partial<ReactiveParams> = {}) {
    this.container = typeof containerRef === 'string'
      ? document.querySelector(containerRef)! as HTMLElement
      : containerRef

    this.params = { ...DEFAULT_PARAMS, ...params }
    this.build()
    this.bindEvents()
  }

  private build(): void {
    const { cols, rows, fontSize, fontFamily, decay, charset, monoRamp } = this.params
    const lineHeight = fontSize + 2
    const targetRowWidth = cols * fontSize * 0.6
    const oversample = 2

    clearChildren(this.container)

    // Brightness field
    this.brightnessField = new BrightnessField({
      fieldCols: cols * oversample,
      fieldRows: rows * oversample,
      decay,
      spriteRadius: 14,
      attractorRadii: [],
    }, cols * fontSize * 0.6, rows * lineHeight)

    // Color config
    const colors: ColorConfig = {
      mode: this.params.colorMode === 'palette' ? 'palette' : 'monochrome',
      palette: this.params.palette,
      monochromeColor: '#c4a35a',
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

  private bindEvents(): void {
    // Mouse tracking
    this.boundMouseMove = (e: MouseEvent) => {
      const rect = this.container.getBoundingClientRect()
      this.lastMouseX = this.mouseX
      this.lastMouseY = this.mouseY
      this.mouseX = e.clientX - rect.left
      this.mouseY = e.clientY - rect.top
      this.mouseVx = this.mouseX - this.lastMouseX
      this.mouseVy = this.mouseY - this.lastMouseY
    }

    this.boundMouseDown = () => { this.mouseDown = true }
    this.boundMouseUp = () => { this.mouseDown = false }

    this.boundWheel = (e: WheelEvent) => {
      if (this.params.inputMode === 'scroll') {
        this.scrollAccum += Math.abs(e.deltaY) * 0.01
      }
    }

    this.boundClick = (e: MouseEvent) => {
      if (this.params.inputMode === 'click') {
        const rect = this.container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        this.splatAt(x, y, this.params.brushSize * 2, this.params.brushIntensity)
      }
    }

    document.addEventListener('mousemove', this.boundMouseMove)
    this.container.addEventListener('mousedown', this.boundMouseDown)
    document.addEventListener('mouseup', this.boundMouseUp)
    window.addEventListener('wheel', this.boundWheel)
    this.container.addEventListener('click', this.boundClick)
  }

  private unbindEvents(): void {
    if (this.boundMouseMove) document.removeEventListener('mousemove', this.boundMouseMove)
    if (this.boundMouseDown) this.container.removeEventListener('mousedown', this.boundMouseDown)
    if (this.boundMouseUp) document.removeEventListener('mouseup', this.boundMouseUp)
    if (this.boundWheel) window.removeEventListener('wheel', this.boundWheel)
    if (this.boundClick) this.container.removeEventListener('click', this.boundClick)
  }

  /** Splat brightness at a position. */
  private splatAt(x: number, y: number, radius: number, intensity: number): void {
    if (!this.brightnessField) return
    // Approximate: splat multiple points in a circle
    const steps = Math.max(4, Math.floor(radius))
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2
      const px = x + Math.cos(angle) * radius * 0.5
      const py = y + Math.sin(angle) * radius * 0.5
      // Direct field splat via a temporary stamp
      this.brightnessField.splatParticle(px, py)
    }
  }

  /** Initialize audio input. */
  private async initAudio(): Promise<void> {
    if (this.audioContext) return
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.audioContext = new AudioContext()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      const source = this.audioContext.createMediaStreamSource(this.audioStream)
      source.connect(this.analyser)
      this.audioData = new Uint8Array(this.analyser.frequencyBinCount)
    } catch (err) {
      console.warn('AsciiReactive: audio access denied', err)
    }
  }

  /** Apply input to the brightness field. */
  private applyInput(): void {
    if (!this.brightnessField) return

    const { inputMode, brushSize, brushIntensity, audioSensitivity } = this.params

    switch (inputMode) {
      case 'mouse': {
        if (this.mouseDown || brushSize > 15) {
          this.splatAt(this.mouseX, this.mouseY, brushSize, brushIntensity)
        }
        break
      }
      case 'scroll': {
        if (this.scrollAccum > 0.5) {
          this.splatAt(this.mouseX, this.mouseY, brushSize, Math.min(1, this.scrollAccum * brushIntensity))
          this.scrollAccum *= 0.5
        }
        break
      }
      case 'audio': {
        if (this.analyser && this.audioData) {
          this.analyser.getByteFrequencyData(this.audioData)
          const cols = this.params.cols
          const rows = this.params.rows
          const binCount = this.audioData.length
          for (let i = 0; i < Math.min(cols, binCount); i++) {
            const val = (this.audioData[i]! / 255) * audioSensitivity
            if (val > 0.1) {
              const x = (i / cols) * cols * 10
              const y = rows * 5 * (1 - val)
              this.brightnessField.splatParticle(x, y)
            }
          }
        }
        break
      }
      case 'custom': {
        if (this.customDataSource) {
          const grid = this.customDataSource()
          for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < grid[y]!.length; x++) {
              if (grid[y]![x]! > 0) {
                this.brightnessField.splatParticle(x * 10, y * 10)
              }
            }
          }
        }
        break
      }
    }
  }

  private frame = (): void => {
    if (!this.running) return
    this.time++

    if (!this.brightnessField) return
    this.brightnessField.decayField()
    this.applyInput()

    if (this.renderer && this.paletteResult) {
      this.renderer.render(this.brightnessField, this.paletteResult.brightnessLookup, this.time)
    }

    this.animationId = requestAnimationFrame(this.frame)
  }

  // --- Public API ---

  start(): void {
    if (this.running) return
    this.running = true
    if (this.params.inputMode === 'audio') this.initAudio()
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
    this.unbindEvents()
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((t) => t.stop())
    }
    if (this.audioContext) this.audioContext.close()
    clearChildren(this.container)
  }

  regenerate(seed: number): void {
    this.params.seed = seed
    this.time = 0
    if (this.brightnessField) this.brightnessField.reset()
  }

  setPreset(name: string): void {
    const preset = REACTIVE_PRESETS.find((p) => p.name === name)
    if (preset) {
      Object.assign(this.params, preset.params)
      this.time = 0
      this.build()
      if (this.running) { this.stop(); this.start() }
    }
  }

  updateParams(partial: Partial<ReactiveParams>): void {
    const structuralKeys = new Set(['cols', 'rows', 'fontSize', 'fontFamily', 'charset', 'monoRamp', 'seed'])
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
    if (partial.inputMode === 'audio' && this.running) {
      this.initAudio()
    }
    if (partial.colorMode !== undefined || partial.palette !== undefined) {
      if (this.renderer) {
        const r = this.renderer as any
        if (r.colors) {
          r.colors.mode = this.params.colorMode === 'palette' ? 'palette' : 'monochrome'
          r.colors.palette = this.params.palette
        }
      }
    }
  }

  /** Set a custom data source function that returns a 2D brightness grid (0–1). */
  setCustomDataSource(fn: () => number[][]): void {
    this.customDataSource = fn
    this.params.inputMode = 'custom'
  }

  getElement(): HTMLElement { return this.container }
  isRunning(): boolean { return this.running }
  getParams(): ReactiveParams { return { ...this.params } }
  getPresets(): ReactivePreset[] { return REACTIVE_PRESETS }
}
