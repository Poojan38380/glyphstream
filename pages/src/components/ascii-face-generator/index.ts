// ============================================================
// GlyphStream — AsciiFaceGenerator Component
// Procedurally generates random talking human faces in ASCII.
// Random gender, facial features, hair, accessories on each generation.
// Male = blue tones, Female = pink tones.
// Mouth animates through talking cycle.
// ============================================================

import { createRng } from '../../utils/math'
import { clearChildren } from '../../utils/dom'

// --- Color Schemes ---

const MALE_COLORS = [
  '#4d96ff', '#6bb5ff', '#3a7bd5', '#5b8def', '#7baaf7',
  '#3d6fc4', '#89b4fa', '#a6c8ff',
]

const FEMALE_COLORS = [
  '#f093fb', '#f5576c', '#ff6b9d', '#f472b6', '#ec4899',
  '#d946ef', '#f9a8d4', '#fbb6ce',
]

// --- Face Grid ---

const W = 44  // columns
const H = 52  // rows

type Grid = string[][]

function makeGrid(): Grid {
  return Array.from({ length: H }, () => Array(W).fill(' '))
}

function drawText(grid: Grid, row: number, col: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    const c = col + i
    if (c >= 0 && c < W && row >= 0 && row < H) {
      grid[row]![c] = text[i]!
    }
  }
}

function drawMultiLine(grid: Grid, startRow: number, startCol: number, text: string): void {
  const lines = text.split('\n')
  for (let r = 0; r < lines.length; r++) {
    drawText(grid, startRow + r, startCol, lines[r]!)
  }
}

// --- Feature Pickers ---

function pick<T>(arr: T[], rng: ReturnType<typeof createRng>): T {
  return arr[rng.nextInt(0, arr.length - 1)]!
}

// Hair: returns array of strings, each string is one row
function pickHair(gender: 'male' | 'female', rng: ReturnType<typeof createRng>): string[] {
  const maleHair = [
    // short
    [
      '    .-""""""""""""""""""""""""""""""""""""""""""""""-.    ',
      '   /                                                  \\   ',
      '  |                                                    |  ',
      '  |                                                    |  ',
    ],
    // spiky
    [
      '    /\\  /\\  /\\  /\\  /\\  /\\  /\\  /\\  /\\  /\\  /\\  /\\  /\\    ',
      '   /  \\/  \\/  \\/  \\/  \\/  \\/  \\/  \\/  \\/  \\/  \\/  \\   ',
      '  |                                                    |  ',
      '  |                                                    |  ',
    ],
    // slicked
    [
      '     ________________________________________            ',
      '    /                                        \\           ',
      '   |                                          |          ',
      '   |                                          |          ',
    ],
    // curly
    [
      '    ()()()()()()()()()()()()()()()()()()()()()()()()()    ',
      '   ()()()()()()()()()()()()()()()()()()()()()()()()()()   ',
      '  |                                                    |  ',
      '  |                                                    |  ',
    ],
    // bald
    [
      '                                                          ',
      '                                                          ',
      '                                                          ',
      '                                                          ',
    ],
    // buzz
    [
      '    .-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-.       ',
      '   |                                                 |      ',
      '   |                                                 |      ',
      '   |                                                 |      ',
    ],
  ]

  const femaleHair = [
    // long straight
    [
      '    .-""""""""""""""""""""""""""""""""""""""""""""""-.    ',
      '   /                                                  \\   ',
      '  |                                                    |  ',
      '  |                                                    |  ',
      '  |                                                    |  ',
      '  |                                                    |  ',
    ],
    // wavy
    [
      '    ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~   ',
      '   ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-   ',
      '  |                                                    |  ',
      '  |                                                    |  ',
      '  |                                                    |  ',
      '  |                                                    |  ',
    ],
    // curly long
    [
      '    ()()()()()()()()()()()()()()()()()()()()()()()()()    ',
      '   ()()()()()()()()()()()()()()()()()()()()()()()()()()   ',
      '  |                                                    |  ',
      '  |                                                    |  ',
      '  |                                                    |  ',
      '  |                                                    |  ',
    ],
    // bob
    [
      '    .-""""""""""""""""""""""""""""""""""""""""""""""-.    ',
      '   /                                                  \\   ',
      '  |                                                    |  ',
      '  |                                                    |  ',
      '   \\__________________________________________________/   ',
    ],
    // ponytail
    [
      '    .-""""""""""""""""""""""""""""""""""""""""""""""-.    ',
      '   /                                    |             \\   ',
      '  |                                     |             |  ',
      '  |                                     |             |  ',
      '  |                                     |             |  ',
      '  |                                     |             |  ',
    ],
    // pixie
    [
      '     .-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-.      ',
      '    /                                               \\     ',
      '   |                                                 |    ',
      '   |                                                 |    ',
    ],
  ]

  return pick(gender === 'male' ? maleHair : femaleHair, rng)
}

// Eyes: returns { left, right } each as string
function pickEyes(rng: ReturnType<typeof createRng>): { left: string; right: string } {
  const eyes = [
    { left: '( o )', right: '( o )' },
    { left: '-_-', right: '-_-' },
    { left: '( O )', right: '( O )' },
    { left: '< >', right: '< >' },
    { left: '·', right: '·' },
    { left: '✦', right: '✦' },
    { left: '---', right: '---' },
    { left: '( o )', right: '---' },
  ]
  return pick(eyes, rng)
}

// Eyebrows
function pickEyebrows(rng: ReturnType<typeof createRng>): { left: string; right: string } {
  const brows = [
    { left: '─────', right: '─────' },
    { left: '═════', right: '═════' },
    { left: '╱‾‾‾╲', right: '╱‾‾‾╲' },
    { left: '╱', right: '╲' },
    { left: '‾‾‾', right: '‾‾‾' },
  ]
  return pick(brows, rng)
}

// Nose
function pickNose(rng: ReturnType<typeof createRng>): string {
  const noses = [
    '|',
    '|\\',
    'o',
    '.',
    '|',
    '<',
  ]
  return pick(noses, rng)
}

// Mouth states for talking
function pickMouth(rng: ReturnType<typeof createRng>): string[] {
  const mouths = [
    ['─────', '╰───╯', '╰─o─╯', '╰───╯', '─────', '     '],
    ['─────', '     ', '╰─o─╯', '     ', '─────', '     '],
    ['═════', '(───)', '(o_o)', '(───)', '═════', '     '],
    ['‾‾‾', '     ', '(o)', '     ', '~~~', '     '],
    ['╰───╯', '╰o_o╯', '╰───╯', '     ', '╰───╯', '╰o_o╯'],
    ['╰═══╯', '╰o_o╯', '╰═══╯', '     ', '╰═══╯', '     '],
  ]
  return pick(mouths, rng)
}

// Face shape: returns { leftEdge, rightEdge } as arrays of chars per row
function pickFaceShape(rng: ReturnType<typeof createRng>): { left: string; right: string }[] {
  const shapes = [
    // oval
    [
      { left: '/', right: '\\' },
      { left: '|', right: '|' },
      { left: '|', right: '|' },
      { left: '|', right: '|' },
      { left: '|', right: '|' },
      { left: '|', right: '|' },
      { left: '|', right: '|' },
      { left: '|', right: '|' },
      { left: '|', right: '|' },
      { left: '\\', right: '/' },
      { left: ' \\', right: '/ ' },
    ],
    // square
    Array(11).fill(null).map(() => ({ left: '|', right: '|' })),
    // round
    [
      { left: ' /', right: '\\ ' },
      { left: '/', right: '\\' },
      { left: '|', right: '|' },
      { left: '|', right: '|' },
      { left: '|', right: '|' },
      { left: '|', right: '|' },
      { left: '|', right: '|' },
      { left: '|', right: '|' },
      { left: '|', right: '|' },
      { left: '\\', right: '/' },
      { left: ' \\', right: '/ ' },
    ],
  ]
  return pick(shapes, rng)
}

// Glasses
function pickGlasses(rng: ReturnType<typeof createRng>): { left: string; right: string; bridge: string } | null {
  const options: ({ left: string; right: string; bridge: string } | null)[] = [
    null,
    { left: '┌───┐', right: '┌───┐', bridge: '─────' },
    { left: '╭───╮', right: '╭───╮', bridge: '─────' },
    { left: '/===\\', right: '/===\\', bridge: '─────' },
  ]
  return pick(options, rng)
}

// Facial hair (male only)
function pickFacialHair(rng: ReturnType<typeof createRng>): { mustache: string; beard: string } | null {
  const options: ({ mustache: string; beard: string } | null)[] = [
    null,
    { mustache: '╰═══╯', beard: '' },
    { mustache: '╰───╯', beard: ' │││ ' },
    { mustache: '╰───╯', beard: '/###\\\n|###|\n \\#/' },
    { mustache: ' ·· ', beard: '' },
    { mustache: '╱═══╲', beard: '' },
  ]
  return pick(options, rng)
}

// --- Generate Face ---

export interface GeneratedFace {
  grid: Grid
  gender: 'male' | 'female'
  color: string
  mouthRow: number
  mouthStates: string[]
  seed: number
}

export function generateFace(seed: number): GeneratedFace {
  const rng = createRng(seed)
  const gender: 'male' | 'female' = rng.next() > 0.5 ? 'male' : 'female'
  const color = pick(gender === 'male' ? MALE_COLORS : FEMALE_COLORS, rng)

  const grid = makeGrid()

  // Feature positions (row indices)
  const cx = Math.floor(W / 2)  // center column = 22
  const faceLeft = cx - 15       // left edge = 7
  const faceRight = cx + 15      // right edge = 37

  // Row layout (top to bottom):
  // 0-1:   empty
  // 2-5/7: hair (4-6 rows)
  // 6+:    face outline starts
  const hair = pickHair(gender, rng)
  const hairStartRow = 2

  // Draw hair
  for (let r = 0; r < hair.length; r++) {
    drawText(grid, hairStartRow + r, 1, hair[r]!)
  }

  // Face outline starts after hair
  const faceTopRow = hairStartRow + hair.length
  const shape = pickFaceShape(rng)

  // Draw face outline
  for (let r = 0; r < shape.length; r++) {
    const row = faceTopRow + r
    if (row >= H) break
    const { left, right } = shape[r]!
    grid[row]![faceLeft] = left
    grid[row]![faceRight] = right
  }

  // Feature rows (relative to faceTopRow)
  const browRow = faceTopRow + 2
  const eyeRow = faceTopRow + 4
  const noseRow = faceTopRow + 7
  const mouthRow = faceTopRow + 9

  // Draw eyebrows
  const brows = pickEyebrows(rng)
  drawText(grid, browRow, cx - 10, brows.left)
  drawText(grid, browRow, cx + 4, brows.right)

  // Draw eyes
  const eyes = pickEyes(rng)
  drawText(grid, eyeRow, cx - 10, eyes.left)
  drawText(grid, eyeRow, cx + 5, eyes.right)

  // Draw glasses
  const glasses = pickGlasses(rng)
  if (glasses) {
    drawText(grid, eyeRow, cx - 11, glasses.left)
    drawText(grid, eyeRow, cx + 4, glasses.right)
    drawText(grid, eyeRow, cx - 5, glasses.bridge)
  }

  // Draw nose
  const nose = pickNose(rng)
  drawText(grid, noseRow, cx, nose)

  // Draw mouth (will be animated)
  const mouthStates = pickMouth(rng)
  // Draw initial mouth state
  drawText(grid, mouthRow, cx - 2, mouthStates[0]!)

  // Draw facial hair (male only)
  const facialHair = gender === 'male' ? pickFacialHair(rng) : null
  if (facialHair) {
    if (facialHair.mustache) {
      drawText(grid, mouthRow + 2, cx - 3, facialHair.mustache)
    }
    if (facialHair.beard) {
      drawMultiLine(grid, mouthRow + 3, cx - 3, facialHair.beard)
    }
  }

  // Draw neck
  const neckRow = faceTopRow + shape.length + 1
  for (let r = 0; r < 4; r++) {
    const row = neckRow + r
    if (row < H) {
      grid[row]![cx - 4] = '|'
      grid[row]![cx + 3] = '|'
    }
  }

  // Draw shoulders
  const shoulderRow = neckRow + 4
  if (shoulderRow < H) {
    const shoulder = gender === 'female'
      ? '   /                       \\   '
      : '  /                         \\  '
    drawText(grid, shoulderRow, cx - Math.floor(shoulder.length / 2), shoulder)
  }

  return {
    grid,
    gender,
    color,
    mouthRow,
    mouthStates,
    seed,
  }
}

// --- Component ---

export class AsciiFaceGenerator {
  private container: HTMLElement
  private face: GeneratedFace | null = null
  private mouthIndex = 0
  private running = false
  private talkTimer: ReturnType<typeof setInterval> | null = null
  private displayEl: HTMLPreElement | null = null
  private labelEl: HTMLDivElement | null = null

  constructor(containerRef: string | HTMLElement) {
    this.container = typeof containerRef === 'string'
      ? document.querySelector(containerRef)! as HTMLElement
      : containerRef
  }

  generate(seed?: number): void {
    const actualSeed = seed ?? Math.floor(Math.random() * 99999)
    this.face = generateFace(actualSeed)
    this.mouthIndex = 0
    this.buildDOM()
  }

  private buildDOM(): void {
    if (!this.face) return

    clearChildren(this.container)

    // Pre element for the face
    this.displayEl = document.createElement('pre')
    Object.assign(this.displayEl.style, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '14px',
      lineHeight: '16px',
      whiteSpace: 'pre',
      textAlign: 'center',
      margin: '0 auto',
      display: 'inline-block',
    })
    this.container.appendChild(this.displayEl)

    // Label
    this.labelEl = document.createElement('div')
    Object.assign(this.labelEl.style, {
      textAlign: 'center',
      marginTop: '16px',
      fontSize: '13px',
      fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    })
    this.container.appendChild(this.labelEl)

    this.renderFrame()
    this.updateLabel()
  }

  private renderFrame(): void {
    if (!this.face || !this.displayEl) return

    const { grid, color, mouthRow, mouthStates } = this.face
    const currentMouth = mouthStates[this.mouthIndex % mouthStates.length]!

    let html = ''
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r]!.length; c++) {
        const char = grid[r]![c]!

        // Check if this cell is part of the mouth
        const isMouth = r === mouthRow &&
          c >= (Math.floor(W / 2) - 2) &&
          c < (Math.floor(W / 2) - 2 + currentMouth.length)

        if (char === ' ' && !isMouth) {
          html += ' '
        } else if (isMouth) {
          const mouthChar = currentMouth[c - (Math.floor(W / 2) - 2)]!
          html += mouthChar === ' ' ? ' '
            : `<span style="color:${color}">${this.esc(mouthChar)}</span>`
        } else if (char !== ' ') {
          html += `<span style="color:${color}">${this.esc(char)}</span>`
        } else {
          html += ' '
        }
      }
      html += '\n'
    }

    this.displayEl.innerHTML = html
  }

  private updateLabel(): void {
    if (!this.face || !this.labelEl) return
    const { gender, color } = this.face
    const label = gender === 'male' ? '♂ Male' : '♀ Female'
    this.labelEl.innerHTML = `<span style="color:${color};font-weight:600">${label}</span>`
  }

  private esc(char: string): string {
    if (char === '<') return '&lt;'
    if (char === '>') return '&gt;'
    if (char === '&') return '&amp;'
    return char
  }

  // --- Public API ---

  startTalking(): void {
    if (this.running) return
    this.running = true
    this.talkTimer = setInterval(() => {
      if (!this.face) return
      this.mouthIndex = (this.mouthIndex + 1) % this.face.mouthStates.length
      this.renderFrame()
    }, 180)
  }

  stopTalking(): void {
    this.running = false
    if (this.talkTimer) {
      clearInterval(this.talkTimer)
      this.talkTimer = null
    }
  }

  dispose(): void {
    this.stopTalking()
    clearChildren(this.container)
    this.face = null
  }

  getFace(): GeneratedFace | null {
    return this.face
  }
}
