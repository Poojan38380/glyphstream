# Contributing to GlyphStream

Thank you for your interest in contributing! GlyphStream is an open-source project and we welcome contributions of all kinds.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/glyphstream.git`
3. Install dependencies: `npm install`
4. Start the dev server: `npm run dev`
5. Make your changes and test locally
6. Submit a pull request

## What You Can Contribute

### 🐛 Bug Fixes

Found a bug? Fix it!

- Check the [Issues](https://github.com/Poojan38380/glyphstream/issues) page to see if it's already reported
- If not, feel free to create an issue first to discuss
- Submit a PR with the fix and a clear description of what was wrong and how you fixed it

### ✨ New Components

Have an idea for a new ASCII art component?

- Create it in `pages/src/components/your-component/`
- Follow the existing component API pattern (`start()`, `stop()`, `dispose()`, etc.)
- Add a demo HTML page in `pages/demos/`
- Update the README with your new component

### 🎨 Presets & Visual Improvements

- Add new presets to existing components
- Improve color palettes
- Add new character ramps
- Fine-tune default parameters

### 📖 Documentation

- Improve README clarity or examples
- Add inline code comments
- Create usage guides for specific use cases

### 🚀 Performance

- Optimize rendering for large grids
- Improve particle simulation speed
- Add Web Worker support for heavy configs

### 🎬 Media Assets

- Better screenshots
- Demo GIFs or videos
- Social preview images

## Code Style

- **TypeScript strict mode** — no `any` unless absolutely necessary
- **Descriptive names** — variables and functions should be self-explanatory
- **Component API consistency** — follow the existing class-based pattern
- **Comments for complex logic** — explain *why*, not *what*

## Pull Request Guidelines

1. **Keep it focused** — one feature/fix per PR
2. **Write a clear title** — e.g., "Add breathe preset to ASCII Ambient"
3. **Describe your changes** — what changed, why, and how to test it
4. **Include screenshots** — for visual changes, always include before/after
5. **Test locally** — run `npm run build` to ensure production build succeeds

## Commit Message Style

Keep commit messages clear and concise:

```
Add spiral flow mode to ASCII Flow Field

Particles now follow spiral patterns when flowMode is set to 'spiral'.
Uses polar coordinate transformation with configurable radius and angle.
```

## Reporting Issues

When reporting a bug:

1. **Describe the issue** — what happened vs. what you expected
2. **Steps to reproduce** — clear, numbered steps
3. **Browser & OS** — e.g., "Chrome 120 on Windows 11"
4. **Screenshots** — if visual
5. **Console errors** — if any

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Questions? Open an issue or reach out on GitHub. Happy hacking! 🎨
