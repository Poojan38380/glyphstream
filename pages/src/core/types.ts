// ============================================================
// GlyphStream — Core Type Definitions
// Shared interfaces for the entire ASCII art engine.
// ============================================================

// --- Color ---

export type ColorMode =
  | 'monochrome'
  | 'gradient'
  | 'palette'
  | 'velocity'
  | 'time'

export interface ColorConfig {
  mode: ColorMode
  /** Single color for monochrome mode (CSS color string) */
  monochromeColor?: string
  /** 2–3 colors for gradient mode, interpolated by brightness */
  gradientColors?: string[]
  /** Discrete palette — brightness maps to palette index */
  palette?: string[]
  /** Time for full color cycle in ms (time mode only) */
  cycleTime?: number
}

// --- Font ---

export type FontStyle = 'normal' | 'italic'

export interface FontVariant {
  weight: number
  style: FontStyle
}

export interface FontConfig {
  /** CSS font family for proportional rendering */
  fontFamily: string
  /** Font size in pixels */
  fontSize: number
  /** Line height in pixels (defaults to fontSize + 2) */
  lineHeight?: number
  /** Font variants to measure (weight × style combos) */
  variants?: FontVariant[]
}

// --- Grid ---

export interface GridConfig {
  /** Number of columns in the output ASCII grid */
  cols: number
  /** Number of rows in the output ASCII grid */
  rows: number
  /** Oversampling factor for the brightness field (default: 2) */
  oversample?: number
}

// --- Character Palette ---

export interface PaletteEntry {
  /** The character itself */
  char: string
  /** Font weight used for this entry */
  weight: number
  /** Font style used for this entry */
  style: FontStyle
  /** Full CSS font string */
  font: string
  /** Measured width in pixels (via pretext) */
  width: number
  /** Normalized brightness 0–1 */
  brightness: number
}

export interface BrightnessLookupEntry {
  /** Character for monospace rendering */
  monoChar: string
  /** HTML string for proportional rendering (may contain <span> tags) */
  propHtml: string
}

export interface CharPaletteConfig {
  /** Characters to include in the palette (space is always included) */
  charset: string
  /** Monospace character ramp for brightness mapping */
  monoRamp: string
  /** Weight for brightness error vs width error in character selection */
  brightnessWeight?: number
}

// --- Particle System ---

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

export interface Attractor {
  x: number
  y: number
  /** Attraction force strength */
  force: number
  /** Radius of influence for sprite rendering */
  radius: number
}

export type AttractorMode = 'lissajous' | 'circular' | 'random' | 'fixed'

export interface ParticleSystemConfig {
  /** Number of particles */
  particleCount: number
  /** Canvas width for the simulation space */
  canvasWidth: number
  /** Canvas height for the simulation space */
  canvasHeight: number
  /** Number of attractors */
  attractorCount: number
  /** How attractors move over time */
  attractorMode: AttractorMode
  /** Radius of particle sprite */
  spriteRadius: number
  /** Peak alpha of particle sprite */
  spritePeakAlpha?: number
  /** Random jitter per frame */
  jitter?: number
  /** Velocity damping per frame (0–1) */
  damping?: number
  /** Random seed for reproducibility */
  seed: number
}

// --- Brightness Field ---

export interface FieldStamp {
  radiusX: number
  radiusY: number
  sizeX: number
  sizeY: number
  values: Float32Array
}

export interface BrightnessFieldConfig {
  /** Width of the oversampled field grid */
  fieldCols: number
  /** Height of the oversampled field grid */
  fieldRows: number
  /** Decay factor per frame (0–1, higher = slower fade) */
  decay: number
  /** Sprite radius for particle splatting */
  spriteRadius: number
  /** Attractor sprite radii (one per attractor) */
  attractorRadii: number[]
}

// --- Renderer ---

export type RenderTarget = 'dom' | 'canvas'

export interface DomRenderOptions {
  target: 'dom'
  /** Container element or CSS selector */
  container: string | HTMLElement
  /** CSS class applied to each row element */
  rowClass?: string
  /** CSS class applied to the art box wrapper */
  boxClass?: string
}

export interface CanvasRenderOptions {
  target: 'canvas'
  /** Canvas element or CSS selector */
  canvas: string | HTMLCanvasElement
}

export type RenderOptions = DomRenderOptions | CanvasRenderOptions

export interface RendererConfig {
  renderOptions: RenderOptions
  /** Grid dimensions */
  grid: GridConfig
  /** Color configuration */
  colors: ColorConfig
  /** Font configuration (for DOM rendering) */
  font?: FontConfig
  /** Monospace font (for mono comparison rendering) */
  monoFontFamily?: string
}

// --- Base Component ---

export interface ComponentConfig {
  grid: GridConfig
  font: FontConfig
  colors: ColorConfig
  charPalette: CharPaletteConfig
  particles: ParticleSystemConfig
  brightnessField: Omit<BrightnessFieldConfig, 'fieldCols' | 'fieldRows' | 'spriteRadius' | 'attractorRadii'>
  seed: number
}

export interface GlyphComponent {
  /** Start the animation loop */
  start(): void
  /** Stop the animation loop */
  stop(): void
  /** Clean up all resources */
  dispose(): void
  /** Regenerate with a new seed */
  regenerate(seed: number): void
  /** Apply a named preset configuration */
  setPreset(name: string): void
  /** Partially update configuration */
  updateConfig(partial: Partial<ComponentConfig>): void
  /** Get the root DOM element */
  getElement(): HTMLElement | HTMLCanvasElement
  /** Check if currently animating */
  isRunning(): boolean
}

// --- Preset ---

export interface Preset {
  name: string
  description: string
  config: Partial<ComponentConfig>
}
