// ============================================================
// GlyphStream — Math Utilities
// Noise, interpolation, and numerical helpers.
// ============================================================

// --- Seeded Random ---

/** Mulberry32 — fast seeded PRNG. */
export function createRng(seed: number) {
  let state = seed | 0
  return {
    /** Float in [0, 1) */
    next(): number {
      state |= 0
      state = (state + 0x6d2b79f5) | 0
      let t = Math.imul(state ^ (state >>> 15), 1 | state)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
    /** Integer in [min, max] */
    nextInt(min: number, max: number): number {
      return min + Math.floor(this.next() * (max - min + 1))
    },
    /** Float in [min, max) */
    nextRange(min: number, max: number): number {
      return min + this.next() * (max - min)
    },
    /** Gaussian-ish value centered on 0 */
    nextGaussian(): number {
      return (this.next() + this.next() + this.next()) / 3 - 0.5
    },
  }
}

// --- Simplex-like Noise (simplified 2D) ---

/**
 * Minimal 2D value noise using a permutation table.
 * Not true Perlin/Simplex — good enough for flow fields
 * and much smaller. For production, consider a full noise lib.
 */
export class ValueNoise2D {
  private perm: number[]
  private seed: number

  constructor(seed: number) {
    this.seed = seed
    this.perm = this.buildPermutation(seed)
  }

  private buildPermutation(seed: number): number[] {
    const rng = createRng(seed)
    const p: number[] = []
    for (let i = 0; i < 256; i++) p[i] = i
    // Fisher-Yates shuffle
    for (let i = 255; i > 0; i--) {
      const j = rng.nextInt(0, i)
      ;[p[i], p[j]] = [p[j]!, p[i]!]
    }
    // Duplicate for overflow
    for (let i = 0; i < 256; i++) p[256 + i] = p[i]!
    return p
  }

  /** Re-seed with a new seed value. */
  reseed(seed: number): void {
    this.seed = seed
    this.perm = this.buildPermutation(seed)
  }

  /** Get noise value at (x, y) in range [-1, 1]. */
  sample(x: number, y: number): number {
    const xi = Math.floor(x) & 255
    const yi = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)

    const u = this.fade(xf)
    const v = this.fade(yf)

    const p = this.perm
    const aa = p[p[xi]! + yi]!
    const ab = p[p[xi]! + yi + 1]!
    const ba = p[p[xi + 1]! + yi]!
    const bb = p[p[xi + 1]! + yi + 1]!

    const x1 = this.lerp(aa, ba, u)
    const x2 = this.lerp(ab, bb, u)

    return this.lerp(x1, x2, v) * 2 - 1
  }

  /** Fractal Brownian Motion — layered octaves. */
  fbm(x: number, y: number, octaves: number, lacunarity = 2.0, gain = 0.5): number {
    let value = 0
    let amplitude = 1
    let frequency = 1
    let maxVal = 0

    for (let i = 0; i < octaves; i++) {
      value += this.sample(x * frequency, y * frequency) * amplitude
      maxVal += amplitude
      amplitude *= gain
      frequency *= lacunarity
    }

    return value / maxVal
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }
}

// --- Interpolation ---

/** Linear interpolation. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Clamp a value between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Map a value from one range to another. */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  const t = (value - inMin) / (inMax - inMin)
  return outMin + clamp(t, 0, 1) * (outMax - outMin)
}

/** Smoothstep interpolation. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

// --- Distance ---

/** Euclidean distance between two points. */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/** Squared distance (avoids sqrt for comparisons). */
export function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return dx * dx + dy * dy
}
