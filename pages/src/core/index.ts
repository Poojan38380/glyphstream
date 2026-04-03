// ============================================================
// GlyphStream — Core Barrel Export
// ============================================================

export type {
  ColorMode,
  ColorConfig,
  FontStyle,
  FontVariant,
  FontConfig,
  GridConfig,
  PaletteEntry,
  BrightnessLookupEntry,
  CharPaletteConfig,
  Particle,
  Attractor,
  AttractorMode,
  ParticleSystemConfig,
  FieldStamp,
  BrightnessFieldConfig,
  RenderTarget,
  DomRenderOptions,
  CanvasRenderOptions,
  RenderOptions,
  RendererConfig,
  ComponentConfig,
  GlyphComponent,
  Preset,
} from './types'

export { ParticleSystem, getSpriteCanvas, spriteAlphaAt } from './particle-system'
export { BrightnessField } from './brightness-field'
export { buildCharPalette, generatePaletteCss } from './char-palette'
export { DomRenderer, CanvasRenderer, createRenderer } from './field-renderer'
export type { FieldRenderer } from './field-renderer'
