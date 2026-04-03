# GlyphStream — Dynamic ASCII Art Component Library

> A creative, reusable component library for generating particle-driven ASCII typography art in the browser. Built on pretext's precise text measurement, designed for frontend designers to drop generative art anywhere.

---

## Project Vision

**GlyphStream** extracts the generative art engine from pretext's `variable-typographic-ascii` demo and transforms it into a **modular, configurable, portfolio-ready component library**. Each component is a self-contained generative art piece that can be embedded in any web project, customized via props/parameters, and showcased as interactive portfolio pieces.

### Design Philosophy

- **Algorithmic Expression**: Each component is a living algorithm, not a static image. Every render is unique, driven by seeded randomness and emergent behavior.
- **Designer-First API**: Clean, intuitive props for font families, color palettes, particle counts, grid sizes, and animation modes. No need to understand the math to use it.
- **Portfolio-Grade Polish**: Every component is production-ready, visually stunning, and interactive enough to stand alone as a portfolio showcase piece.
- **Zero Dependencies (Core)**: The core library uses only pretext for text measurement. Components ship as single HTML/TS files that work standalone or integrate into React/Vue/vanilla projects.

---

## Folder Structure

```
glyphstream/
├── README.md                    # Project overview, quick start, showcase
├── package.json                 # Build scripts, dev server, dependencies
├── tsconfig.json                # TypeScript configuration
├── index.html                   # Homepage — component gallery & playground
│
├── src/
│   ├── core/                    # Core generative engine (shared utilities)
│   │   ├── brightness-field.ts  # Particle simulation → brightness field pipeline
│   │   ├── char-palette.ts      # Character measurement, brightness lookup tables
│   │   ├── particle-system.ts   # Particle physics, attractors, force dynamics
│   │   ├── field-renderer.ts    # Brightness field → ASCII character rendering
│   │   └── types.ts             # Shared TypeScript interfaces
│   │
│   ├── components/              # 5 Reusable ASCII Art Components
│   │   ├── ascii-flow-field/    # Component 1: Flow Field ASCII
│   │   │   ├── index.ts         # Component entry point
│   │   │   ├── config.ts        # Default parameters & presets
│   │   │   └── renderer.ts      # Rendering logic
│   │   │
│   │   ├── ascii-portrait/      # Component 2: Image-to-ASCII Portrait
│   │   │   ├── index.ts
│   │   │   ├── config.ts
│   │   │   └── renderer.ts
│   │   │
│   │   ├── ascii-typography/    # Component 3: Variable Weight Typography
│   │   │   ├── index.ts         # (Direct evolution of pretext demo)
│   │   │   ├── config.ts
│   │   │   └── renderer.ts
│   │   │
│   │   ├── ascii-reactive/      # Component 4: Mouse/Reactive ASCII
│   │   │   ├── index.ts
│   │   │   ├── config.ts
│   │   │   └── renderer.ts
│   │   │
│   │   └── ascii-ambient/       # Component 5: Slow Ambient Background
│   │       ├── index.ts
│   │       ├── config.ts
│   │       └── renderer.ts
│   │
│   └── utils/
│       ├── color.ts             # Color palette utilities
│       ├── math.ts              # Noise functions, interpolation helpers
│       └── dom.ts               # DOM mounting, cleanup utilities
│
├── pages/
│   ├── index.html               # Homepage: Gallery + Interactive Playground
│   ├── demos/
│   │   ├── ascii-flow-field.html
│   │   ├── ascii-portrait.html
│   │   ├── ascii-typography.html
│   │   ├── ascii-reactive.html
│   │   └── ascii-ambient.html
│   └── assets/
│       └── (sample images for portrait demo, fonts, etc.)
│
├── playground/                  # Interactive parameter playground
│   └── index.html               # Single page with sidebar controls for all components
│
├── scripts/
│   ├── build-site.ts            # Build static site for deployment
│   └── generate-presets.ts      # Generate seed presets for showcase
│
└── dist/                        # Built output (static site)
    ├── index.html
    ├── demos/
    ├── playground/
    └── assets/
```

---

## The 5 Reusable Components

### 1. **ASCII Flow Field** — `ascii-flow-field`

**What it does**: Generates ASCII art from layered Perlin/simplex noise flow fields. Particles follow vector forces, accumulating into organic density maps that are then rendered as ASCII characters.

**Use cases**: Hero sections, background textures, loading screens, generative backgrounds for posters.

**Configurable parameters**:
- `cols` / `rows` — Grid resolution
- `particleCount` — Number of particles (100–2000)
- `noiseScale` — Zoom level of noise field
- `noiseOctaves` — Detail level (1–8)
- `speed` — Animation speed multiplier
- `charset` — Character ramp (default: ` .,:;!+-=*#@%`)
- `fontFamily` — Font for rendering
- `fontSize` — Character size in px
- `colorMode` — `'monochrome' | 'palette' | 'gradient'`
- `palette` — Array of colors for palette mode
- `seed` — Random seed for reproducibility
- `animationMode` — `'animate' | 'static' | 'evolve'`

**Presets**: `calm`, `turbulent`, `spiral`, `waves`, `static-art`

**API**:
```typescript
import { AsciiFlowField } from 'glyphstream'

const art = new AsciiFlowField('#container', {
  cols: 80,
  rows: 40,
  particleCount: 800,
  noiseScale: 0.005,
  colorMode: 'gradient',
  palette: ['#c4a35a', '#8b6914', '#4a3520'],
  seed: 42,
})

art.start()
art.stop()
art.regenerate(123) // new seed
art.setPreset('turbulent')
```

---

### 2. **ASCII Portrait** — `ascii-portrait`

**What it does**: Converts an image (URL, `<img>`, `<canvas>`, or `ImageData`) into ASCII art. Samples pixel brightness from the source image and maps it to characters with optional color tinting.

**Use cases**: Profile pictures, album art visualizers, photo gallery ASCII conversions, interactive art installations.

**Configurable parameters**:
- `source` — Image URL, `<img>`, `<canvas>`, or `ImageData`
- `cols` / `rows` — Output grid size (auto-calculated from aspect ratio if only one specified)
- `charset` — Character ramp (dark→light)
- `invert` — Flip brightness mapping
- `colorMode` — `'grayscale' | 'source-color' | 'tint'`
- `tintColor` — Color for tint mode
- `contrast` — Brightness contrast multiplier
- `brightness` — Brightness offset
- `fontFamily` / `fontSize` — Typography settings
- `dither` — `'none' | 'floyd-steinberg' | 'ordered'`

**Presets**: `photo`, `high-contrast`, `tinted`, `color-rich`, `minimal`

**API**:
```typescript
import { AsciiPortrait } from 'glyphstream'

const art = new AsciiPortrait('#container', {
  source: './my-photo.jpg',
  cols: 120,
  charset: ' .`-_:,;^=+/|)\\!?0oOQ#%@',
  colorMode: 'tint',
  tintColor: '#c4a35a',
  contrast: 1.2,
  dither: 'floyd-steinberg',
})

art.render()
art.updateSource('./new-photo.jpg')
```

---

### 3. **ASCII Typography** — `ascii-typography`

**What it does**: The direct evolution of pretext's `variable-typographic-ascii` demo. Particle-driven brightness field rendered with variable font weights, styles, and sizes. Supports proportional AND monospace output with side-by-side comparison mode.

**Use cases**: Portfolio hero pieces, interactive typography showcases, generative art posters, brand identity animations.

**Configurable parameters**:
- `cols` / `rows` — Grid resolution
- `fontFamily` — Proportional font family
- `monoFontFamily` — Monospace font family
- `weights` — Array of font weights (e.g., `[300, 500, 800]`)
- `styles` — `['normal', 'italic']`
- `fontSize` — Base font size
- `particleCount` — Number of particles
- `attractorCount` — Number of attractors (1–4)
- `attractorMode` — `'lissajous' | 'circular' | 'random' | 'mouse'`
- `decay` — Field decay rate (0.0–1.0)
- `colorPalette` — Array of colors for brightness levels
- `monoTint` — Color for monospace panel
- `showSource` — Show/hide the source simulation canvas
- `showMono` — Show/hide monospace comparison panel
- `seed` — Random seed

**Presets**: `classic` (pretext default), `bold-italic`, `minimal`, `rainbow`, `monochrome-only`

**API**:
```typescript
import { AsciiTypography } from 'glyphstream'

const art = new AsciiTypography('#container', {
  cols: 60,
  rows: 30,
  fontFamily: 'Georgia, serif',
  weights: [300, 500, 800],
  styles: ['normal', 'italic'],
  particleCount: 150,
  attractorMode: 'lissajous',
  colorPalette: ['#c4a35a', '#e8c96a', '#8b6914'],
  monoTint: 'rgba(130,155,210,0.7)',
  showSource: true,
  showMono: true,
  seed: 77,
})

art.start()
art.setPreset('bold-italic')
```

---

### 4. **ASCII Reactive** — `ascii-reactive`

**What it does**: ASCII art that responds to user input — mouse position, clicks, scroll, audio input, or custom data streams. The brightness field is driven by interactive forces rather than autonomous particles.

**Use cases**: Interactive installations, mouse-follow effects, scroll-triggered animations, audio visualizers, data-driven art.

**Configurable parameters**:
- `cols` / `rows` — Grid resolution
- `inputMode` — `'mouse' | 'click' | 'scroll' | 'audio' | 'custom'`
- `brushSize` — Size of the reactive brush stroke
- `brushIntensity` — Brightness added per interaction
- `decay` — How quickly the field fades
- `trailMode` — `'fade' | 'accumulate' | 'bounce'`
- `charset` — Character ramp
- `fontFamily` / `fontSize` — Typography
- `colorMode` — `'velocity' | 'position' | 'time' | 'palette'`
- `palette` — Color array for palette mode
- `audioSensitivity` — For audio input mode
- `customDataSource` — Function returning brightness values for custom mode

**Presets**: `paintbrush`, `ripple`, `audio-viz`, `scroll-reveal`, `magnetic`

**API**:
```typescript
import { AsciiReactive } from 'glyphstream'

const art = new AsciiReactive('#container', {
  cols: 100,
  rows: 50,
  inputMode: 'mouse',
  brushSize: 8,
  brushIntensity: 0.6,
  decay: 0.95,
  colorMode: 'velocity',
  palette: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'],
})

art.start()

// Switch to audio mode
art.setInputMode('audio', { audioSensitivity: 0.8 })

// Custom data source
art.setInputMode('custom', {
  customDataSource: () => {
    return myExternalData.getBrightnessGrid()
  }
})
```

---

### 5. **ASCII Ambient** — `ascii-ambient`

**What it does**: Slow, meditative ASCII art that evolves over time. Minimal particle count, gentle forces, long decay times. Designed as a living background that breathes — perfect for ambient displays, digital signage, or portfolio backgrounds.

**Use cases**: Ambient screensavers, portfolio backgrounds, meditation/focus apps, digital art installations, slow TV.

**Configurable parameters**:
- `cols` / `rows` — Grid resolution
- `particleCount` — Low count by default (20–80)
- `speed` — Very slow by default (0.1–0.5)
- `decay` — High decay for ghostly persistence (0.95–0.99)
- `forceMode` — `'gentle' | 'drift' | 'breathe'`
- `charset` — Sparse character set for minimalism
- `fontFamily` / `fontSize` — Typography
- `colorMode` — `'dawn' | 'dusk' | 'midnight' | 'custom'`
- `palette` — Custom color palette
- `cycleTime` — Time for full color cycle in ms
- `seed` — Random seed

**Presets**: `dawn`, `dusk`, `midnight`, `breathing`, `drift`

**API**:
```typescript
import { AsciiAmbient } from 'glyphstream'

const art = new AsciiAmbient('#container', {
  cols: 80,
  rows: 40,
  particleCount: 40,
  speed: 0.15,
  decay: 0.97,
  forceMode: 'breathe',
  colorMode: 'dawn',
  palette: ['#ffecd2', '#fcb69f', '#a1c4fd'],
  cycleTime: 60000, // 1 minute full cycle
})

art.start()
art.pause()
art.resume()
```

---

## Homepage Design (`index.html`)

### Layout

```
┌─────────────────────────────────────────────────────┐
│  GlyphStream                                        │
│  Dynamic ASCII Art Components                        │
│  [GitHub] [Docs] [Playground]                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  HERO: Live ASCII Flow Field (Component 1)    │  │
│  │  Animated, interactive background             │  │
│  │  "Click to regenerate · Scroll to zoom"       │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Components                                         │
│  ──────────                                         │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ Flow     │ │ Portrait │ │ Typo-    │            │
│  │ Field    │ │          │ │ graphy   │            │
│  │ [Demo]   │ │ [Demo]   │ │ [Demo]   │            │
│  └──────────┘ └──────────┘ └──────────┘            │
│  ┌──────────┐ ┌──────────┐                         │
│  │ Reactive │ │ Ambient  │                         │
│  │ [Demo]   │ │          │                         │
│  │ [Demo]   │ │ [Demo]   │                         │
│  └──────────┘ └──────────┘                         │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Quick Start                                        │
│  ───────────                                        │
│  npm install glyphstream                            │
│  import { AsciiFlowField } from 'glyphstream'       │
│  const art = new AsciiFlowField('#el', {...})       │
│  art.start()                                        │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Built with pretext · Open Source · MIT License     │
│  Made by [Your Name] · [Twitter] · [GitHub]         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Homepage Features
- **Live hero**: Component 1 (Flow Field) runs as the hero background
- **Component cards**: Each component has a thumbnail preview (animated GIF or live mini-canvas)
- **Interactive playground link**: Goes to `/playground/` with full parameter controls
- **Quick start code**: Copy-paste installation and usage example
- **Responsive**: Works on mobile with stacked cards

---

## Component Demo Pages

Each component gets its own dedicated page (`/demos/ascii-flow-field.html`, etc.) with:

1. **Full-size live preview** of the component
2. **Sidebar parameter controls** (sliders, color pickers, seed navigation)
3. **Preset buttons** (quick-switch between curated configurations)
4. **Code snippet** showing how to use this specific component
5. **Parameter reference table** (all options with descriptions)
6. **Back to gallery** link

---

## Technical Architecture

### Core Engine (`src/core/`)

The core engine is extracted and generalized from pretext's `variable-typographic-ascii.ts`:

```
brightness-field.ts    — Particle simulation → Float32Array brightness field
char-palette.ts        — Character measurement (width via pretext, brightness via canvas)
particle-system.ts     — Particle physics, attractors, forces, toroidal wrapping
field-renderer.ts      — Brightness field → character lookup → DOM/Canvas rendering
types.ts               — All shared TypeScript interfaces
```

**Key design decisions**:
- **Pretext as peer dependency**: Core uses `prepareWithSegments()` for width measurement. Pretext is imported dynamically or passed as a dependency.
- **Canvas-optional rendering**: Components can render to DOM (HTML spans) OR to canvas (for performance).
- **Web Worker support**: Particle simulation can run in a Web Worker for heavy configurations.
- **Disposable**: All components implement `dispose()` for clean teardown (important for SPAs).

### Component Pattern

Each component follows a consistent class-based API:

```typescript
class AsciiComponent {
  constructor(container: string | HTMLElement, config: ComponentConfig)
  start(): void
  stop(): void
  dispose(): void
  regenerate(seed?: number): void
  setPreset(name: string): void
  updateConfig(partial: Partial<ComponentConfig>): void
  getElement(): HTMLElement
}
```

### Build System

- **Development**: `bun pages/*.html pages/demos/*.html --watch --host=127.0.0.1:3000` (same as pretext)
- **Production**: `bun run scripts/build-site.ts` → outputs to `dist/`
- **TypeScript**: Strict mode, ES modules, target ES2020
- **No bundler required for dev**: Each demo page imports TS directly via Bun's native TS support
- **Optional bundler**: For npm package distribution, use `tsup` or `rolldown` to produce ESM/CJS bundles

---

## Color & Typography System

### Color Palettes

Each component supports multiple color modes:

| Mode | Description | Example Use |
|------|-------------|-------------|
| `monochrome` | Single color with alpha based on brightness | Classic ASCII art |
| `gradient` | 2–3 colors interpolated by brightness | Warm/cool tones |
| `palette` | Discrete color palette, brightness maps to palette index | Themed art |
| `velocity` | Color based on particle velocity (reactive only) | Motion visualization |
| `time` | Color shifts over time (ambient only) | Living backgrounds |

### Typography

- **Proportional fonts**: Georgia, Palatino, Times New Roman (serif); Helvetica, Arial (sans)
- **Monospace fonts**: Courier New, Fira Code, JetBrains Mono
- **Variable fonts**: If the font supports `font-variation-settings`, components can animate weight/width axes
- **Font loading**: Uses `document.fonts.ready` to ensure fonts are loaded before measurement

---

## Performance Considerations

| Concern | Solution |
|---------|----------|
| Large grids (100+ cols) | Canvas rendering instead of DOM spans |
| Many particles (1000+) | Web Worker for simulation |
| Font measurement caching | Cache character widths per font/weight/style combo |
| Sprite caching | Pre-render particle sprites to offscreen canvases |
| Field stamp optimization | Use `Float32Array` and precomputed stamp templates |
| Animation frame throttling | `requestAnimationFrame` with visibility API pause |

---

## Future Extensions (Not in v1)

- **React/Vue wrappers**: Framework-specific component wrappers
- **Shader-based rendering**: GPU-accelerated brightness field computation
- **3D ASCII**: Extruded ASCII characters in Three.js
- **Video input**: Real-time webcam → ASCII conversion
- **MIDI/Audio reactive**: Direct MIDI input or FFT audio analysis
- **Export**: Save ASCII art as PNG, SVG, or animated GIF
- **CLI tool**: `glyphstream generate --preset calm --output art.png`

---

## Development Phases

### Phase 1: Core Engine (Week 1)
- [ ] Extract and generalize `brightness-field.ts` from pretext demo
- [ ] Build `char-palette.ts` with pretext integration
- [ ] Implement `particle-system.ts` with configurable forces
- [ ] Create `field-renderer.ts` with DOM and Canvas modes
- [ ] Write `types.ts` with full TypeScript interfaces
- [ ] Unit test core pipeline: particles → field → characters

### Phase 2: Component 1 & 2 (Week 2)
- [ ] Build `ascii-flow-field` with full parameter API
- [ ] Build `ascii-portrait` with image loading and dithering
- [ ] Create demo pages for both components
- [ ] Add sidebar parameter controls
- [ ] Implement preset system

### Phase 3: Component 3, 4, 5 (Week 3)
- [ ] Build `ascii-typography` (evolution of pretext demo)
- [ ] Build `ascii-reactive` with mouse/audio input modes
- [ ] Build `ascii-ambient` with slow evolution and color cycling
- [ ] Create demo pages for all three
- [ ] Cross-browser testing

### Phase 4: Homepage & Polish (Week 4)
- [ ] Design and build homepage with live hero
- [ ] Create playground page with all components
- [ ] Write README with installation, usage, and API docs
- [ ] Add code snippets to each demo page
- [ ] Performance optimization
- [ ] Responsive design
- [ ] Deploy to GitHub Pages / Vercel

---

## Portfolio Positioning

**GlyphStream** is positioned as:

1. **A creative tool**: Frontend designers can drop these into any project for instant generative art
2. **A technical showcase**: Demonstrates mastery of canvas APIs, text measurement, particle systems, and TypeScript
3. **A pretext extension**: Shows practical application of pretext's text measurement in creative coding
4. **A living library**: Components can be mixed, matched, and extended for future projects

**Portfolio narrative**:
> "GlyphStream extracts the generative ASCII engine from my work with pretext and transforms it into a reusable component library. Five distinct components cover flow fields, image conversion, variable typography, interactive art, and ambient backgrounds. Each is a living algorithm — every render is unique, every seed tells a different story."

---

## Naming Rationale

**GlyphStream** = "Glyph" (character/typography) + "Stream" (flow of particles, data, animation)

- Short, memorable, and descriptive
- Evokes both typography and generative flow
- Available as npm package name (to be verified)
- Works as a brand: "GlyphStream components", "GlyphStream playground"

Alternatives considered: `ascii-engine`, `charflow`, `typo-particles`, `textstream`, `glyph-field`

---

## License

**MIT** — Same as pretext. Free to use, modify, and distribute. Attribution appreciated but not required.

---

## Credits

- **Inspired by**: pretext's `variable-typographic-ascii` demo by Cheng Lou
- **Built by**: [Your Name]
- **Text measurement**: [pretext](https://github.com/chenglou/pretext)
- **Philosophy**: Algorithmic art as living systems — beauty emerges from process, not product
