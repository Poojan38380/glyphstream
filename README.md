# GlyphStream

<p align="center">
  <strong>Dynamic ASCII Art Components for the Browser</strong>
</p>

<p align="center">
  <em>Five generative algorithms — each a living system, every render unique.</em>
</p>

<p align="center">
  <a href="https://glyphstream.vercel.app/"><strong>🔗 Live Demo</strong></a>
  ·
  <a href="#components"><strong>📦 Components</strong></a>
  ·
  <a href="#quick-start"><strong>🚀 Quick Start</strong></a>
  ·
  <a href="#api-reference"><strong>📖 API Reference</strong></a>
</p>

<p align="center">
  <a href="https://glyphstream.vercel.app/">
    <img src="https://raw.githubusercontent.com/Poojan38380/glyphstream/main/public/home-page.png" alt="GlyphStream Homepage" width="100%">
  </a>
  <br>
  <em>The GlyphStream homepage — a live ASCII flow field runs as the hero background.</em>
</p>

---

## What is GlyphStream?

GlyphStream is an **open-source generative ASCII art engine** built for the browser. It uses particle-driven brightness fields, text measurement via [pretext](https://github.com/chenglou/pretext), and variable font rendering to create stunning, ever-changing ASCII art.

Each component is a **living algorithm** — not a static image. Every render is unique, driven by seeded randomness and emergent behavior.

### Why it's cool

- 🎨 **5 distinct components** — flow fields, typography, reactive art, ambient backgrounds, and face generation
- 🔧 **Designer-first API** — clean props for fonts, colors, particle counts, seeds
- ⚡ **Zero framework dependency** — works with vanilla JS, React, Vue, anything
- 🌈 **Color palettes** — monochrome, gradient, multi-color modes
- 🎯 **Seeded randomness** — reproduce any render with a seed value
- 📱 **Responsive** — works on any screen size
- 🏗️ **Built on pretext** — precise text measurement by Cheng Lou

---

## Components

### 〰️ ASCII Flow Field

Generative ASCII art from layered Perlin noise flow fields. Particles follow vector forces, accumulating into organic density maps.

<p align="center">
  <img src="https://raw.githubusercontent.com/Poojan38380/glyphstream/main/public/ASCII-flow-field.png" alt="ASCII Flow Field" width="80%">
</p>

| Feature | Details |
|---------|---------|
| **Use cases** | Hero sections, generative backgrounds, loading screens |
| **Modes** | `noise`, `spiral`, `waves` |
| **Particles** | 100–2000 |
| **Presets** | `calm`, `turbulent`, `spiral`, `waves`, `static-art` |
| **[Live Demo →](https://glyphstream.vercel.app/demos/ascii-flow-field.html)** | |

---

### 𝐀 ASCII Typography

Particle-driven brightness field rendered with variable font weights, styles, and sizes. Supports proportional AND monospace side-by-side comparison.

<p align="center">
  <img src="https://raw.githubusercontent.com/Poojan38380/glyphstream/main/public/ascii-typography.png" alt="ASCII Typography" width="80%">
</p>

| Feature | Details |
|---------|---------|
| **Use cases** | Portfolio hero pieces, typography showcases, generative art posters |
| **Font variants** | Multiple weights (300, 500, 800) × styles (normal, italic) |
| **Attractors** | `lissajous`, `circular`, `random`, `mouse` |
| **Panels** | Proportional + monospace comparison |
| **[Live Demo →](https://glyphstream.vercel.app/demos/ascii-typography.html)** | |

---

### 🖱️ ASCII Reactive

ASCII art that responds to user input — mouse position, clicks, scroll, or custom data streams.

<p align="center">
  <img src="https://raw.githubusercontent.com/Poojan38380/glyphstream/main/public/reactive.png" alt="ASCII Reactive" width="80%">
</p>

| Feature | Details |
|---------|---------|
| **Use cases** | Interactive installations, audio visualizers, data-driven art |
| **Input modes** | `mouse`, `click`, `scroll`, `audio`, `custom` |
| **Color modes** | `velocity`, `position`, `time`, `palette` |
| **Brush** | Configurable size, intensity, trail modes |
| **[Live Demo →](https://glyphstream.vercel.app/demos/ascii-reactive.html)** | |

---

### 🌅 ASCII Ambient

Slow, meditative ASCII art that evolves over time. Minimal particle count, gentle forces, long decay times.

<p align="center">
  <img src="https://raw.githubusercontent.com/Poojan38380/glyphstream/main/public/ambient.png" alt="ASCII Ambient" width="80%">
</p>

<p align="center">
  <video src="https://raw.githubusercontent.com/Poojan38380/glyphstream/main/public/ambient.mp4" autoplay loop muted playsinline width="80%"></video>
  <br>
  <em>Watch the ambient background breathe and drift in real-time.</em>
</p>

| Feature | Details |
|---------|---------|
| **Use cases** | Ambient screensavers, portfolio backgrounds, meditation apps |
| **Particles** | 20–80 (low count for minimalism) |
| **Force modes** | `gentle`, `drift`, `breathe` |
| **Color modes** | `dawn`, `dusk`, `midnight`, `custom` |
| **[Live Demo →](https://glyphstream.vercel.app/demos/ascii-ambient.html)** | |

---

### 🎭 ASCII Face Generator

Procedurally generated talking faces with random gender, features, and accessories.

<p align="center">
  <img src="https://raw.githubusercontent.com/Poojan38380/glyphstream/main/public/face-generator.png" alt="ASCII Face Generator" width="80%">
</p>

| Feature | Details |
|---------|---------|
| **Use cases** | Fun demos, avatar generation, procedural art |
| **Randomization** | Gender, eye shape, mouth style, accessories |
| **Color coding** | Blue tones, pink tones, custom palettes |
| **[Live Demo →](https://glyphstream.vercel.app/demos/ascii-face-generator.html)** | |

---

## Quick Start

### Clone & Run

```bash
git clone https://github.com/Poojan38380/glyphstream.git
cd glyphstream
npm install
npm run dev
```

Open `http://localhost:3001` — that's it.

### Use in Your Project

Each component is a self-contained TypeScript module. Import and instantiate:

```typescript
import { AsciiFlowField } from './src/components/ascii-flow-field'

const art = new AsciiFlowField('#container', {
  cols: 80,
  rows: 40,
  particleCount: 600,
  noiseScale: 0.005,
  colorMode: 'gradient',
  palette: ['#c4a35a', '#8b6914', '#4a3520'],
  seed: 42,
})

art.start()
art.setPreset('turbulent')
art.regenerate(123) // new seed, new art
```

### Production Build

```bash
npm run build
```

Output goes to `dist/` — deploy anywhere as a static site.

---

## API Reference

### Common Component API

Every component follows the same pattern:

```typescript
class AsciiComponent {
  constructor(container: string | HTMLElement, config: ComponentConfig)

  start(): void          // Begin animation
  stop(): void           // Stop animation
  dispose(): void        // Clean up (important for SPAs)
  regenerate(seed?: number): void  // New seed
  setPreset(name: string): void    // Apply a preset
  updateConfig(partial: Partial<ComponentConfig>): void
  getElement(): HTMLElement
}
```

### Configuration Options

#### All Components

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cols` | `number` | `80` | Grid columns |
| `rows` | `number` | `40` | Grid rows |
| `fontSize` | `number` | `12` | Font size in px |
| `fontFamily` | `string` | `'Georgia, serif'` | CSS font family |
| `charset` | `string` | `' .,:;!+-=*#@%'` | Character ramp (dark → light) |
| `colorMode` | `string` | `'monochrome'` | `'monochrome' \| 'gradient' \| 'palette'` |
| `palette` | `string[]` | `[]` | Array of hex colors |
| `seed` | `number` | `random` | Random seed for reproducibility |
| `decay` | `number` | `0.94` | Field decay rate (0.0–1.0) |

#### Flow Field Specifics

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `particleCount` | `number` | `600` | Number of particles |
| `noiseScale` | `number` | `0.005` | Noise zoom level |
| `noiseOctaves` | `number` | `3` | Noise detail level |
| `particleSpeed` | `number` | `1.0` | Speed multiplier |
| `flowMode` | `string` | `'noise'` | `'noise' \| 'spiral' \| 'waves'` |
| `monochromeColor` | `string` | `'#c4a35a'` | Color for monochrome mode |

#### Typography Specifics

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `weights` | `number[]` | `[300, 500, 800]` | Font weights |
| `styles` | `string[]` | `['normal', 'italic']` | Font styles |
| `monoFontFamily` | `string` | `'Courier New, monospace'` | Monospace font |
| `attractorMode` | `string` | `'lissajous'` | `'lissajous' \| 'circular' \| 'random' \| 'mouse'` |
| `showMono` | `boolean` | `true` | Show monospace panel |
| `showSource` | `boolean` | `false` | Show source simulation |
| `monoTint` | `string` | `'rgba(130,155,210,0.7)'` | Monospace panel tint |

#### Reactive Specifics

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `inputMode` | `string` | `'mouse'` | `'mouse' \| 'click' \| 'scroll' \| 'audio' \| 'custom'` |
| `brushSize` | `number` | `8` | Reactive brush size |
| `brushIntensity` | `number` | `0.6` | Brightness per interaction |
| `trailMode` | `string` | `'fade'` | `'fade' \| 'accumulate' \| 'bounce'` |

#### Ambient Specifics

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `particleCount` | `number` | `40` | Low count (20–80) |
| `speed` | `number` | `0.15` | Very slow evolution |
| `forceMode` | `string` | `'breathe'` | `'gentle' \| 'drift' \| 'breathe'` |
| `colorMode` | `string` | `'dawn'` | `'dawn' \| 'dusk' \| 'midnight' \| 'custom'` |
| `cycleTime` | `number` | `60000` | Full color cycle in ms |

---

## Project Structure

```
glyphstream/
├── README.md                    # You are here
├── PLAN.md                      # Full project vision & architecture
├── package.json                 # Dependencies & scripts
├── vite.config.ts               # Vite MPA configuration
├── vercel.json                  # Vercel deployment config
├── tsconfig.json                # TypeScript configuration
│
├── pages/
│   ├── index.html               # Homepage (gallery + playground)
│   ├── demos/                   # Individual component demos
│   │   ├── ascii-flow-field.html
│   │   ├── ascii-typography.html
│   │   ├── ascii-reactive.html
│   │   ├── ascii-ambient.html
│   │   └── ascii-face-generator.html
│   └── src/                     # All source code
│       ├── core/                # Core generative engine
│       │   ├── brightness-field.ts
│       │   ├── char-palette.ts
│       │   ├── field-renderer.ts
│       │   ├── particle-system.ts
│       │   └── types.ts
│       ├── components/          # 5 reusable components
│       │   ├── ascii-flow-field/
│       │   ├── ascii-typography/
│       │   ├── ascii-reactive/
│       │   ├── ascii-ambient/
│       │   └── ascii-face-generator/
│       └── utils/               # Shared utilities
│           ├── color.ts
│           ├── dom.ts
│           └── math.ts
│
├── public/                      # Static assets (screenshots, videos)
└── dist/                        # Production build output
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Language** | TypeScript (strict mode) |
| **Build** | Vite 5 (Multi-Page App) |
| **Text Measurement** | [@chenglou/pretext](https://github.com/chenglou/pretext) |
| **Rendering** | Canvas 2D + DOM |
| **Deployment** | Vercel (static site) |
| **Dependencies** | 1 runtime dependency (pretext) |

---

## Philosophy

> **Algorithmic art as living systems — beauty emerges from process, not product.**

GlyphStream is built on the idea that every render tells a different story. The same seed, the same parameters — but watch it breathe, and you'll never see the exact same art twice.

---

## Built With GlyphStream

Projects and demos powered by GlyphStream:

- [glyphstream.vercel.app](https://glyphstream.vercel.app/) — Live demo site

Built something with GlyphStream? [Open a PR](https://github.com/Poojan38380/glyphstream/pulls) and add it here!

---

## Contributing

We love contributions! Whether it's:

- 🐛 Bug fixes
- ✨ New components
- 🎨 New presets
- 📖 Documentation improvements
- 🚀 Performance optimizations

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## License

**MIT** — Free to use, modify, and distribute. Attribution appreciated but not required.

---

## Credits

- **Built by** [Poojan](https://github.com/Poojan38380)
- **Text measurement** powered by [pretext](https://github.com/chenglou/pretext) by Cheng Lou
- **Inspired by** pretext's `variable-typographic-ascii` demo

---

<p align="center">
  <sub>Made with ☕ and ASCII characters</sub>
</p>
