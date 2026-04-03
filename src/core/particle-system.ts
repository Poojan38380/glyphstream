// ============================================================
// GlyphStream — Particle System
// Manages particles, attractors, and force-based movement.
// Supports multiple attractor modes (lissajous, circular, random, fixed).
// ============================================================

import type { Particle, Attractor, ParticleSystemConfig, AttractorMode } from './types'
import { createRng } from '../utils/math'

// --- Sprite Cache ---

const spriteCache = new Map<number, HTMLCanvasElement>()

/** Get or create a radial gradient sprite canvas for a given radius. */
export function getSpriteCanvas(radius: number, peakAlpha = 0.45): HTMLCanvasElement {
  const cacheKey = radius * 1000 + Math.round(peakAlpha * 100)
  const cached = spriteCache.get(cacheKey)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = radius * 2
  canvas.height = radius * 2
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('GlyphStream: failed to create sprite canvas context')

  const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius)
  gradient.addColorStop(0, `rgba(255,255,255,${peakAlpha})`)
  gradient.addColorStop(0.35, `rgba(255,255,255,${peakAlpha * 0.33})`)
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, radius * 2, radius * 2)

  spriteCache.set(cacheKey, canvas)
  return canvas
}

/** Calculate alpha at a normalized distance from sprite center. */
export function spriteAlphaAt(normalizedDistance: number, peakAlpha = 0.45): number {
  if (normalizedDistance >= 1) return 0
  if (normalizedDistance <= 0.35) {
    return peakAlpha + (peakAlpha * 0.33 - peakAlpha) * (normalizedDistance / 0.35)
  }
  return peakAlpha * 0.33 * (1 - (normalizedDistance - 0.35) / 0.65)
}

// --- Particle System ---

export class ParticleSystem {
  private particles: Particle[] = []
  private attractors: Attractor[] = []
  private rng = createRng(0)

  // Config
  private canvasWidth: number
  private canvasHeight: number
  private attractorMode: AttractorMode
  private spriteRadius: number
  private jitter: number
  private damping: number
  private seed: number

  // Lissajous frequencies (for attractor movement)
  private lissajousFreqs: { fx: number; fy: number; phase: number }[] = []

  constructor(config: ParticleSystemConfig) {
    this.canvasWidth = config.canvasWidth
    this.canvasHeight = config.canvasHeight
    this.attractorMode = config.attractorMode
    this.spriteRadius = config.spriteRadius
    this.jitter = config.jitter ?? 0.25
    this.damping = config.damping ?? 0.97
    this.seed = config.seed

    this.rng = createRng(config.seed)
    this.initParticles(config.particleCount)
    this.initAttractors(config.attractorCount)
  }

  /** Re-initialize with a new seed. */
  reseed(seed: number): void {
    this.seed = seed
    this.rng = createRng(seed)
    this.initParticles(this.particles.length)
    // Keep attractor count the same
    this.initAttractors(this.attractors.length)
  }

  /** Update all attractor positions based on time and mode. */
  updateAttractors(time: number): void {
    const w = this.canvasWidth
    const h = this.canvasHeight

    for (let i = 0; i < this.attractors.length; i++) {
      const attr = this.attractors[i]!
      const freq = this.lissajousFreqs[i]!

      switch (this.attractorMode) {
        case 'lissajous': {
          attr.x = Math.cos(time * freq.fx + freq.phase) * w * 0.25 + w / 2
          attr.y = Math.sin(time * freq.fy + freq.phase) * h * 0.3 + h / 2
          break
        }
        case 'circular': {
          const angle = time * freq.fx + freq.phase
          const radius = Math.min(w, h) * 0.3
          attr.x = Math.cos(angle) * radius + w / 2
          attr.y = Math.sin(angle) * radius + h / 2
          break
        }
        case 'random': {
          // Slowly drift to random positions
          const speed = 0.0003
          attr.x += Math.sin(time * speed + i) * 0.5
          attr.y += Math.cos(time * speed * 1.3 + i * 2) * 0.5
          // Wrap
          if (attr.x < 0) attr.x += w
          if (attr.x > w) attr.x -= w
          if (attr.y < 0) attr.y += h
          if (attr.y > h) attr.y -= h
          break
        }
        case 'fixed':
          // Attractors stay at their initial positions
          break
      }
    }
  }

  /** Update all particle positions (one simulation step). */
  updateParticles(): void {
    const w = this.canvasWidth
    const h = this.canvasHeight
    const spriteR = this.spriteRadius

    for (const p of this.particles) {
      // Find nearest attractor
      let nearestDistSq = Infinity
      let nearestDx = 0
      let nearestDy = 0
      let nearestForce = 0

      for (const attr of this.attractors) {
        const dx = attr.x - p.x
        const dy = attr.y - p.y
        const distSq = dx * dx + dy * dy
        if (distSq < nearestDistSq) {
          nearestDistSq = distSq
          nearestDx = dx
          nearestDy = dy
          nearestForce = attr.force
        }
      }

      const dist = Math.sqrt(nearestDistSq) + 1

      // Apply attraction force
      p.vx += (nearestDx / dist) * nearestForce
      p.vy += (nearestDy / dist) * nearestForce

      // Random jitter
      p.vx += (this.rng.next() - 0.5) * this.jitter * 2
      p.vy += (this.rng.next() - 0.5) * this.jitter * 2

      // Damping
      p.vx *= this.damping
      p.vy *= this.damping

      // Move
      p.x += p.vx
      p.y += p.vy

      // Toroidal wrapping
      if (p.x < -spriteR) p.x += w + spriteR * 2
      if (p.x > w + spriteR) p.x -= w + spriteR * 2
      if (p.y < -spriteR) p.y += h + spriteR * 2
      if (p.y > h + spriteR) p.y -= h + spriteR * 2
    }
  }

  // --- Getters ---

  getParticles(): readonly Particle[] {
    return this.particles
  }

  getAttractors(): readonly Attractor[] {
    return this.attractors
  }

  /** Get the sprite canvas for a particle (shared radius). */
  getParticleSprite(): HTMLCanvasElement {
    return getSpriteCanvas(this.spriteRadius)
  }

  /** Get the sprite canvas for a specific attractor by index. */
  getAttractorSprite(index: number): HTMLCanvasElement {
    const attr = this.attractors[index]
    if (!attr) return getSpriteCanvas(this.spriteRadius)
    return getSpriteCanvas(attr.radius)
  }

  /** Update attractor radii (e.g., when config changes). */
  updateAttractorRadii(radii: number[]): void {
    for (let i = 0; i < this.attractors.length; i++) {
      if (radii[i] !== undefined) {
        this.attractors[i]!.radius = radii[i]!
      }
    }
  }

  /** Update attractor forces. */
  updateAttractorForces(forces: number[]): void {
    for (let i = 0; i < this.attractors.length; i++) {
      if (forces[i] !== undefined) {
        this.attractors[i]!.force = forces[i]!
      }
    }
  }

  // --- Private ---

  private initParticles(count: number): void {
    const cx = this.canvasWidth / 2
    const cy = this.canvasHeight / 2

    this.particles = []
    for (let i = 0; i < count; i++) {
      const angle = this.rng.next() * Math.PI * 2
      const radius = this.rng.next() * 40 + 20
      this.particles.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: (this.rng.next() - 0.5) * 0.8,
        vy: (this.rng.next() - 0.5) * 0.8,
      })
    }
  }

  private initAttractors(count: number): void {
    const w = this.canvasWidth
    const h = this.canvasHeight

    this.attractors = []
    this.lissajousFreqs = []

    // Default attractor configs — varied by index
    const defaultConfigs = [
      { force: 0.22, radius: 30, fx: 0.0007, fy: 0.0011, phase: 0 },
      { force: 0.05, radius: 12, fx: 0.0013, fy: 0.0009, phase: Math.PI },
      { force: 0.15, radius: 20, fx: 0.0009, fy: 0.0007, phase: Math.PI / 2 },
      { force: 0.08, radius: 25, fx: 0.0011, fy: 0.0013, phase: Math.PI * 1.5 },
    ]

    for (let i = 0; i < count; i++) {
      const cfg = defaultConfigs[i % defaultConfigs.length]!
      this.attractors.push({
        x: w / 2 + (this.rng.next() - 0.5) * w * 0.3,
        y: h / 2 + (this.rng.next() - 0.5) * h * 0.3,
        force: cfg.force,
        radius: cfg.radius,
      })
      this.lissajousFreqs.push({
        fx: cfg.fx,
        fy: cfg.fy,
        phase: cfg.phase + i * 0.5,
      })
    }
  }
}
