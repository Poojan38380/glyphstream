// ============================================================
// GlyphStream — AsciiFaceGenerator v2
// Procedurally generated talking faces with viseme-based mouth
// animation, refined facial features, and expressive detail.
//
// Based on Disney's 13-viseme system for American English,
// reduced to 8 ASCII-friendly visemes with co-articulation
// blending and natural timing.
// ============================================================

import { createRng, lerp, clamp, smoothstep } from '../../utils/math'
import { clearChildren } from '../../utils/dom'

// --- Color Palettes ---

const MALE_PALETTES = [
  { primary: '#4d96ff', secondary: '#3a7bd5', accent: '#89b4fa', shadow: '#1a3a5c' },
  { primary: '#6bb5ff', secondary: '#5b8def', accent: '#a6c8ff', shadow: '#2a4a6c' },
  { primary: '#89b4fa', secondary: '#3d6fc4', accent: '#7baaf7', shadow: '#1a2a4c' },
  { primary: '#5b8def', secondary: '#4d96ff', accent: '#6bb5ff', shadow: '#2a3a5c' },
  { primary: '#3a7bd5', secondary: '#4d96ff', accent: '#a6c8ff', shadow: '#1a2a5c' },
]

const FEMALE_PALETTES = [
  { primary: '#f093fb', secondary: '#ec4899', accent: '#f9a8d4', shadow: '#5c1a3a' },
  { primary: '#f5576c', secondary: '#ff6b9d', accent: '#fbb6ce', shadow: '#5c1a2a' },
  { primary: '#f472b6', secondary: '#d946ef', accent: '#f9a8d4', shadow: '#4c1a3a' },
  { primary: '#ec4899', secondary: '#f093fb', accent: '#fbb6ce', shadow: '#3a1a4c' },
  { primary: '#ff6b9d', secondary: '#f472b6', accent: '#f093fb', shadow: '#4c1a2a' },
]

// --- Grid ---

const W = 48
const H = 30

type Grid = string[][]

function makeGrid(): Grid {
  return Array.from({ length: H }, () => Array(W).fill(' '))
}

function setChar(grid: Grid, r: number, c: number, ch: string): void {
  if (r >= 0 && r < H && c >= 0 && c < W) grid[r]![c] = ch
}

function drawStr(grid: Grid, r: number, c: number, s: string): void {
  for (let i = 0; i < s.length; i++) setChar(grid, r, c + i, s[i]!)
}

function drawMulti(grid: Grid, r: number, c: number, text: string): void {
  text.split('\n').forEach((line, i) => drawStr(grid, r + i, c, line))
}

// --- Viseme System (8 ASCII visemes, derived from Disney's 13) ---

const VISEMES: Record<string, string[]> = {
  // 1. Rest / closed — neutral expression
  rest:     ['─────'],
  // 2. Slightly open — neutral vowel [eɪ, ɛ, ʌ]
  slight:   [' ╰─╯ '],
  // 3. Wide open — [æ, ɑ] dropped jaw
  wide:     [' ╰───╯'],
  // 4. Rounded — [u, oʊ] pursed lips
  rounded:  [' ( o )'],
  // 5. Spread — [i, ɪ] wide smile
  spread:   [' ╰═══╯'],
  // 6. Closed lips — [p, b, m] bilabial
  closed:   [' ═════'],
  // 7. Teeth visible — [s, z, t, d]
  teeth:    [' ╰‾‾‾╯'],
  // 8. Open O — [aʊ, ɔ] round open
  openO:    [' ╰ ○ ╯'],
}

const VISEME_NAMES = Object.keys(VISEMES)

/** Generate a natural talking sequence — a cycle of visemes with co-articulation timing. */
function generateSpeechCycle(rng: ReturnType<typeof createRng>): { visemes: string[]; timings: number[] } {
  // Natural speech rhythm: rest → slight → wide → rounded → spread → teeth → slight → rest
  // with varying hold times
  const patterns = [
    ['rest', 'slight', 'wide', 'slight', 'rest', 'closed', 'slight', 'teeth', 'slight', 'rest'],
    ['rest', 'spread', 'wide', 'rounded', 'slight', 'rest', 'openO', 'slight', 'rest'],
    ['rest', 'slight', 'teeth', 'wide', 'slight', 'closed', 'spread', 'slight', 'rest'],
    ['rest', 'wide', 'rounded', 'slight', 'teeth', 'rest', 'slight', 'openO', 'rest'],
    ['rest', 'slight', 'spread', 'wide', 'slight', 'closed', 'rest', 'teeth', 'slight', 'rest'],
  ]
  const pattern = patterns[rng.nextInt(0, patterns.length - 1)]

  const visemes: string[] = []
  const timings: number[] = []

  for (const name of pattern) {
    visemes.push(name)
    // Hold time: 3-8 frames per viseme (50-130ms at 60fps)
    timings.push(rng.nextInt(3, 8))
  }

  return { visemes, timings }
}

// --- Feature Generators ---

function pick<T>(arr: T[], rng: ReturnType<typeof createRng>): T {
  return arr[rng.nextInt(0, arr.length - 1)]!
}

// Hair styles — each returns array of strings
function genHair(gender: 'male' | 'female', rng: ReturnType<typeof createRng>): string[] {
  const male = [
    // short clean
    [
      '      .-""""""""""""""""""""""""""""""""""""""""""""""-.      ',
      '     /                                                  \\     ',
      '    |                                                    |    ',
      '    |                                                    |    ',
    ],
    // textured/spiky
    [
      '      /\\  /\\  /\\  /\\  /\\  /\\  /\\  /\\  /\\  /\\  /\\  /\\  /\\      ',
      '     /  \\/  \\/  \\/  \\/  \\/  \\/  \\/  \\/  \\/  \\/  \\/  \\     ',
      '    |                                                    |    ',
      '    |                                                    |    ',
    ],
    // side part
    [
      '       ________________________________________              ',
      '      /                                       /|             ',
      '     |                                       | |            ',
      '     |                                       | |            ',
    ],
    // curly
    [
      '      ()()()()()()()()()()()()()()()()()()()()()()()()()      ',
      '     ()()()()()()()()()()()()()()()()()()()()()()()()()()     ',
      '    |                                                    |    ',
      '    |                                                    |    ',
    ],
    // buzz
    [
      '      .-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-.       ',
      '     |                                                 |      ',
      '     |                                                 |      ',
      '     |                                                 |      ',
    ],
    // swept back
    [
      '       ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~        ',
      '      ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~     ',
      '     |                                                    |    ',
      '     |                                                    |    ',
    ],
  ]

  const female = [
    // long straight
    [
      '      .-""""""""""""""""""""""""""""""""""""""""""""""-.      ',
      '     /                                                  \\     ',
      '    |                                                    |    ',
      '    |                                                    |    ',
      '    |                                                    |    ',
      '    |                                                    |    ',
    ],
    // wavy
    [
      '      ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~     ',
      '     ~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-~-     ',
      '    |                                                    |    ',
      '    |                                                    |    ',
      '    |                                                    |    ',
      '    |                                                    |    ',
    ],
    // curly long
    [
      '      ()()()()()()()()()()()()()()()()()()()()()()()()()      ',
      '     ()()()()()()()()()()()()()()()()()()()()()()()()()()     ',
      '    |                                                    |    ',
      '    |                                                    |    ',
      '    |                                                    |    ',
      '    |                                                    |    ',
    ],
    // bob
    [
      '      .-""""""""""""""""""""""""""""""""""""""""""""""-.      ',
      '     /                                                  \\     ',
      '    |                                                    |    ',
      '    |                                                    |    ',
      '     \\__________________________________________________/     ',
    ],
    // layered
    [
      '      .-""""""""""""""""""""""""""""""""""""""""""""""-.      ',
      '     /  ~-~-~-~-~                            ~-~-~-~-~  \\     ',
      '    |  ~-~-~-~-~                              ~-~-~-~-~  |    ',
      '    |                                                    |    ',
      '    |                                                    |    ',
      '    |                                                    |    ',
    ],
    // pixie
    [
      '       .-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-.        ',
      '      /                                               \\       ',
      '     |                                                 |      ',
      '     |                                                 |      ',
    ],
  ]

  return pick(gender === 'male' ? male : female, rng)
}

// Face shape
function genFaceShape(rng: ReturnType<typeof createRng>): { left: string[]; right: string[] } {
  const shapes = [
    // oval
    {
      left:  [' /', '/', '|', '|', '|', '|', '|', '|', '|', '\\', ' \\'],
      right: ['\\ ', '\\', '|', '|', '|', '|', '|', '|', '|', '/', ' /'],
    },
    // round
    {
      left:  ['  /', ' /', '|', '|', '|', '|', '|', '|', ' \\', '  \\'],
      right: ['\\  ', ' \\', '|', '|', '|', '|', '|', '|', ' /', '  /'],
    },
    // square
    {
      left:  ['|', '|', '|', '|', '|', '|', '|', '|', '|', '|', '|'],
      right: ['|', '|', '|', '|', '|', '|', '|', '|', '|', '|', '|'],
    },
    // heart
    {
      left:  [' /', '/ ', '| ', '| ', '| ', '| ', '| ', '\\ ', ' \\', '  \\'],
      right: ['\\ ', ' \\', ' |', ' |', ' |', ' |', ' |', ' /', ' /', '  /'],
    },
  ]
  return pick(shapes, rng)
}

// Eyes
function genEyes(rng: ReturnType<typeof createRng>): { left: string; right: string } {
  const eyes = [
    { left: '( ● )', right: '( ● )' },
    { left: '( ◉ )', right: '( ◉ )' },
    { left: '( o )', right: '( o )' },
    { left: '⟨ ◉ ⟩', right: '⟨ ◉ ⟩' },
    { left: '·  ·', right: '' },
    { left: '─ ‿ ─', right: '' },
    { left: '( ◠ )', right: '( ◠ )' },
    { left: '◕   ◕', right: '' },
  ]
  return pick(eyes, rng)
}

// Eyebrows
function genBrows(rng: ReturnType<typeof createRng>): { left: string; right: string } {
  const brows = [
    { left: '╱‾‾‾‾‾╲', right: '╱‾‾‾‾‾╲' },
    { left: '───────', right: '───────' },
    { left: '═══════', right: '═══════' },
    { left: '╱', right: '╲' },
    { left: '‾‾‾‾‾‾‾', right: '‾‾‾‾‾‾‾' },
    { left: '╱‾‾‾╲', right: '╱‾‾‾╲' },
  ]
  return pick(brows, rng)
}

// Nose
function genNose(rng: ReturnType<typeof createRng>): string {
  const noses = ['│', '┃', '│\\', '│/', '┊', '│', '┃', '│']
  return pick(noses, rng)
}

// Glasses
function genGlasses(rng: ReturnType<typeof createRng>): { left: string; right: string; bridge: string } | null {
  const opts: ({ left: string; right: string; bridge: string } | null)[] = [
    null, null, null, // 60% no glasses
    { left: '┌─────┐', right: '┌─────┐', bridge: '───────' },
    { left: '╭─────╮', right: '╭─────╮', bridge: '───────' },
    { left: '/=====\\', right: '/=====\\', bridge: '───────' },
    { left: '┌─◉─┐', right: '┌─◉─┐', bridge: '───────' },
  ]
  return pick(opts, rng)
}

// Facial hair (male)
function genFacialHair(rng: ReturnType<typeof createRng>): { mustache: string; beard: string | null } | null {
  const opts: ({ mustache: string; beard: string | null } | null)[] = [
    null, null, null, // 50% no facial hair
    { mustache: '╰─────╯', beard: null },
    { mustache: '╰═══╯', beard: null },
    { mustache: '╱═════╲', beard: null },
    { mustache: '╰─────╯', beard: '  │││  ' },
    { mustache: '╰─────╯', beard: ' /###\\\n |###|\n  \\#/' },
    { mustache: ' · · ', beard: null },
  ]
  return pick(opts, rng)
}

// Ears
function genEars(rng: ReturnType<typeof createRng>): { left: string; right: string } {
  const earOpts = [
    { left: '3', right: 'Ɛ' },
    { left: ')', right: '(' },
    { left: '}', right: '{' },
    { left: '❯', right: '❮' },
  ]
  return pick(earOpts, rng)
}

// --- Main Generation ---

export interface GeneratedFace {
  grid: Grid
  gender: 'male' | 'female'
  palette: typeof MALE_PALETTES[0]
  mouthRow: number
  mouthCol: number
  mouthWidth: number
  speechCycle: { visemes: string[]; timings: number[] }
  blinkState: number
  seed: number
}

export function generateFace(seed: number): GeneratedFace {
  const rng = createRng(seed)
  const gender: 'male' | 'female' = rng.next() > 0.5 ? 'male' : 'female'
  const palette = pick(gender === 'male' ? MALE_PALETTES : FEMALE_PALETTES, rng)

  const grid = makeGrid()
  const cx = Math.floor(W / 2) // 25

  // Face dimensions
  const faceLeft = cx - 16  // 9
  const faceRight = cx + 16 // 41
  const faceWidth = faceRight - faceLeft + 1 // 33

  // === LAYOUT ===
  // Row 0-1: empty
  // Row 2-5/7: hair
  // Row 6+: face outline
  const hair = genHair(gender, rng)
  const hairRow = 2

  // Draw hair
  for (let r = 0; r < hair.length; r++) {
    drawStr(grid, hairRow + r, 2, hair[r]!)
  }

  // Face outline
  const faceTop = hairRow + hair.length
  const shape = genFaceShape(rng)

  for (let r = 0; r < shape.left.length; r++) {
    const row = faceTop + r
    if (row >= H) break
    drawStr(grid, row, faceLeft, shape.left[r]!)
    drawStr(grid, row, faceRight - shape.right[r]!.length + 1, shape.right[r]!)
  }

  // Feature rows (relative to faceTop)
  const browRow = faceTop + 2
  const eyeRow = faceTop + 4
  const earRow = faceTop + 4
  const noseRow = faceTop + 7
  const mouthRow = faceTop + 9
  const chinRow = faceTop + shape.left.length

  // Ears
  const ears = genEars(rng)
  setChar(grid, earRow, faceLeft - 1, ears.left)
  setChar(grid, earRow, faceRight + 1, ears.right)

  // Eyebrows
  const brows = genBrows(rng)
  drawStr(grid, browRow, cx - 12, brows.left)
  drawStr(grid, browRow, cx + 5, brows.right)

  // Eyes
  const eyes = genEyes(rng)
  drawStr(grid, eyeRow, cx - 12, eyes.left)
  drawStr(grid, eyeRow, cx + 5, eyes.right)

  // Glasses
  const glasses = genGlasses(rng)
  if (glasses) {
    drawStr(grid, eyeRow, cx - 13, glasses.left)
    drawStr(grid, eyeRow, cx + 5, glasses.right)
    drawStr(grid, eyeRow, cx - 6, glasses.bridge)
  }

  // Nose
  const nose = genNose(rng)
  drawStr(grid, noseRow, cx, nose)

  // Mouth — initial state (rest)
  const mouthStr = VISEMES.rest[0]!
  const mouthCol = cx - Math.floor(mouthStr.length / 2)
  drawStr(grid, mouthRow, mouthCol, mouthStr)

  // Facial hair
  const facialHair = gender === 'male' ? genFacialHair(rng) : null
  if (facialHair) {
    drawStr(grid, mouthRow + 2, cx - 4, facialHair.mustache)
    if (facialHair.beard) {
      drawMulti(grid, mouthRow + 3, cx - 4, facialHair.beard)
    }
  }

  // Neck
  const neckTop = faceTop + shape.left.length
  for (let r = 0; r < 4; r++) {
    setChar(grid, neckTop + r, cx - 4, '|')
    setChar(grid, neckTop + r, cx + 3, '|')
  }

  // Shoulders
  const shoulderRow = neckTop + 4
  if (shoulderRow < H) {
    const shoulder = gender === 'female'
      ? '     /                         \\     '
      : '    /                           \\    '
    drawStr(grid, shoulderRow, cx - Math.floor(shoulder.length / 2), shoulder)
  }

  // Speech cycle
  const speechCycle = generateSpeechCycle(rng)

  return {
    grid,
    gender,
    palette,
    mouthRow,
    mouthCol,
    mouthWidth: mouthStr.length,
    speechCycle,
    blinkState: 0,
    seed,
  }
}

// --- Component ---

export class AsciiFaceGenerator {
  private container: HTMLElement
  private face: GeneratedFace | null = null
  private running = false
  private talkTimer: ReturnType<typeof setInterval> | null = null
  private blinkTimer: ReturnType<typeof setInterval> | null = null
  private displayEl: HTMLPreElement | null = null
  private labelEl: HTMLDivElement | null = null
  private frameCount = 0

  // Speech tracking
  private currentVisemeIndex = 0
  private visemeFrameCount = 0

  constructor(containerRef: string | HTMLElement) {
    this.container = typeof containerRef === 'string'
      ? document.querySelector(containerRef)! as HTMLElement
      : containerRef
  }

  generate(seed?: number): void {
    this.stopTalking()
    const actualSeed = seed ?? Math.floor(Math.random() * 99999)
    this.face = generateFace(actualSeed)
    this.frameCount = 0
    this.currentVisemeIndex = 0
    this.visemeFrameCount = 0
    this.buildDOM()
  }

  private buildDOM(): void {
    if (!this.face) return
    clearChildren(this.container)

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

  /** Get the current viseme string based on speech timing. */
  private getCurrentViseme(): string {
    if (!this.face) return VISEMES.rest[0]!
    const { visemes, timings } = this.face.speechCycle

    // Advance through visemes based on timing
    this.visemeFrameCount++
    if (this.visemeFrameCount >= timings[this.currentVisemeIndex]!) {
      this.visemeFrameCount = 0
      this.currentVisemeIndex = (this.currentVisemeIndex + 1) % visemes.length
    }

    const visemeName = visemes[this.currentVisemeIndex]!
    return VISEMES[visemeName]![0]!
  }

  /** Apply a viseme to the grid at the mouth position. */
  private applyMouthToGrid(grid: Grid, mouthStr: string): void {
    if (!this.face) return
    const { mouthRow, mouthCol } = this.face
    drawStr(grid, mouthRow, mouthCol, mouthStr)
  }

  /** Clear mouth area in grid. */
  private clearMouthInGrid(grid: Grid): void {
    if (!this.face) return
    const { mouthRow, mouthCol } = this.face
    for (let c = mouthCol; c < mouthCol + 8; c++) {
      setChar(grid, mouthRow, c, ' ')
    }
  }

  private renderFrame(): void {
    if (!this.face || !this.displayEl) return

    const { grid, palette, mouthCol } = this.face

    // Get current viseme
    const mouthStr = this.getCurrentViseme()
    const mouthWidth = mouthStr.length

    // Build HTML
    let html = ''
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r]!.length; c++) {
        const char = grid[r]![c]!

        // Check if this is the mouth row and within mouth area
        const isMouth = r === this.face.mouthRow &&
          c >= mouthCol && c < mouthCol + mouthWidth

        if (char === ' ' && !isMouth) {
          html += ' '
        } else if (isMouth) {
          const mouthChar = mouthStr[c - mouthCol]!
          if (mouthChar === ' ') {
            html += ' '
          } else {
            // Mouth uses accent color for emphasis
            html += `<span style="color:${palette.accent}">${this.esc(mouthChar)}</span>`
          }
        } else if (char !== ' ') {
          // Determine if this is a "shadow" character (edges of face)
          const isEdge = char === '/' || char === '\\' || char === '|' || char === '3' || char === 'Ɛ'
          const color = isEdge ? palette.shadow : palette.primary
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
    const { gender, palette, seed } = this.face
    const label = gender === 'male' ? '♂ Male' : '♀ Female'
    this.labelEl.innerHTML = `
      <span style="color:${palette.primary};font-weight:600">${label}</span>
      <span style="color:rgba(255,255,255,0.15);margin:0 8px">·</span>
      <span style="color:rgba(255,255,255,0.2);font-family:monospace;font-size:11px">seed: ${seed}</span>
    `
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
      if (!this.running || !this.face) return
      this.renderFrame()
    }, 50) // 50ms = 20fps for smooth talking
  }

  stopTalking(): void {
    this.running = false
    if (this.talkTimer) {
      clearInterval(this.talkTimer)
      this.talkTimer = null
    }
    if (this.blinkTimer) {
      clearInterval(this.blinkTimer)
      this.blinkTimer = null
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
