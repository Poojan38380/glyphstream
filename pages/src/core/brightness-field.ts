// ============================================================
// GlyphStream — Brightness Field
// Manages the oversampled Float32Array brightness field,
// precomputed field stamps, and splatting operations.
// ============================================================

import type { FieldStamp, BrightnessFieldConfig } from './types'
import { spriteAlphaAt } from './particle-system'

export class BrightnessField {
  private field: Float32Array
  private fieldCols: number
  private fieldRows: number
  private decay: number

  // Scale factors from simulation canvas to field grid
  private scaleX: number
  private scaleY: number

  // Precomputed stamps
  private particleStamp: FieldStamp
  private attractorStamps: FieldStamp[] = []

  constructor(config: BrightnessFieldConfig, simWidth: number, simHeight: number) {
    this.fieldCols = config.fieldCols
    this.fieldRows = config.fieldRows
    this.decay = config.decay
    this.scaleX = config.fieldCols / simWidth
    this.scaleY = config.fieldRows / simHeight

    this.field = new Float32Array(this.fieldCols * this.fieldRows)

    // Precompute stamps
    this.particleStamp = this.createFieldStamp(config.spriteRadius)
    this.attractorStamps = config.attractorRadii.map((r) => this.createFieldStamp(r))
  }

  /** Decay the entire field by the decay factor. */
  decayField(): void {
    for (let i = 0; i < this.field.length; i++) {
      this.field[i] = this.field[i]! * this.decay
    }
  }

  /** Splat the particle stamp at the given simulation coordinates. */
  splatParticle(simX: number, simY: number): void {
    this.splatStamp(simX, simY, this.particleStamp)
  }

  /** Splat an attractor stamp at the given simulation coordinates. */
  splatAttractor(simX: number, simY: number, index: number): void {
    const stamp = this.attractorStamps[index]
    if (stamp) this.splatStamp(simX, simY, stamp)
  }

  /**
   * Sample the field at a grid cell, averaging an oversampled block.
   * Returns brightness in range [0, 1].
   */
  sampleCell(gridCol: number, gridRow: number, oversample: number): number {
    const fieldColStart = gridCol * oversample
    const fieldRowStart = gridRow * oversample
    let brightness = 0
    let count = 0

    for (let sy = 0; sy < oversample; sy++) {
      const fieldRow = fieldRowStart + sy
      if (fieldRow < 0 || fieldRow >= this.fieldRows) continue
      const rowOffset = fieldRow * this.fieldCols
      for (let sx = 0; sx < oversample; sx++) {
        const fieldCol = fieldColStart + sx
        if (fieldCol < 0 || fieldCol >= this.fieldCols) continue
        brightness += this.field[rowOffset + fieldCol]!
        count++
      }
    }

    return count > 0 ? brightness / count : 0
  }

  /** Reset the entire field to zero. */
  reset(): void {
    this.field.fill(0)
  }

  /** Get the raw field data (for debugging or custom rendering). */
  getData(): Float32Array {
    return this.field
  }

  /** Get field dimensions. */
  getDimensions(): { cols: number; rows: number } {
    return { cols: this.fieldCols, rows: this.fieldRows }
  }

  /** Update decay factor. */
  setDecay(decay: number): void {
    this.decay = decay
  }

  // --- Private ---

  /** Create a precomputed field stamp for a given radius. */
  private createFieldStamp(radiusPx: number): FieldStamp {
    const fieldRadiusX = Math.ceil(radiusPx * this.scaleX)
    const fieldRadiusY = Math.ceil(radiusPx * this.scaleY)
    const sizeX = fieldRadiusX * 2 + 1
    const sizeY = fieldRadiusY * 2 + 1
    const values = new Float32Array(sizeX * sizeY)

    for (let y = -fieldRadiusY; y <= fieldRadiusY; y++) {
      for (let x = -fieldRadiusX; x <= fieldRadiusX; x++) {
        const normDist = Math.sqrt(
          (x / (radiusPx * this.scaleX)) ** 2 + (y / (radiusPx * this.scaleY)) ** 2,
        )
        values[(y + fieldRadiusY) * sizeX + x + fieldRadiusX] = spriteAlphaAt(normDist)
      }
    }

    return {
      radiusX: fieldRadiusX,
      radiusY: fieldRadiusY,
      sizeX,
      sizeY,
      values,
    }
  }

  /** Splat a precomputed stamp onto the field at simulation coordinates. */
  private splatStamp(simCenterX: number, simCenterY: number, stamp: FieldStamp): void {
    const gridCenterX = Math.round(simCenterX * this.scaleX)
    const gridCenterY = Math.round(simCenterY * this.scaleY)

    for (let y = -stamp.radiusY; y <= stamp.radiusY; y++) {
      const gridY = gridCenterY + y
      if (gridY < 0 || gridY >= this.fieldRows) continue

      const fieldRowOffset = gridY * this.fieldCols
      const stampRowOffset = (y + stamp.radiusY) * stamp.sizeX

      for (let x = -stamp.radiusX; x <= stamp.radiusX; x++) {
        const gridX = gridCenterX + x
        if (gridX < 0 || gridX >= this.fieldCols) continue

        const stampValue = stamp.values[stampRowOffset + x + stamp.radiusX]!
        if (stampValue === 0) continue

        const fieldIndex = fieldRowOffset + gridX
        // Clamp to 1
        this.field[fieldIndex] = Math.min(1, this.field[fieldIndex]! + stampValue)
      }
    }
  }
}
