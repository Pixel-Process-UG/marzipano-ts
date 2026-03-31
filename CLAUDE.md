# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Marzipano-TS is a 360° media viewer for the modern web — a JavaScript library using WebGL to render panoramic images with multiple geometries (Cube, Equirect, Flat) and projection types. Fork of Google's Marzipano, maintained by Pixel & Process.

**Key Technologies:** ES6 modules, Vite, Vitest, WebGL, JSDoc, Hammer.js (touch), gl-matrix (3D math)

## Development Commands

```bash
npm install                    # Install dependencies
npm run dev                    # Vite dev server on http://localhost:8080
npm run build                  # Production build (ESM + UMD → dist/)
npm run preview                # Preview production build
```

### Testing

```bash
npm test                       # Run all tests
npm test -- test/suite/TextureStore.js       # Run specific test file
npm test -- --grep "RenderLoop"              # Run tests matching pattern
npm run test:watch                           # Watch mode
npm run test:watch -- test/suite/Viewer.js   # Watch specific file
npm run test:ui                              # Vitest UI
npm run coverage                             # Coverage report (70% threshold for lines/functions/branches/statements)
```

- Tests in `test/suite/` mirror `src/` structure
- Vitest with Mocha-compatible API (describe/it) + Chai assertions + Sinon stubs
- jsdom environment, 10s timeout
- `test/wait.js` provides async test helpers
- **Prefer promises over `done()` callbacks** — done() is deprecated in Vitest

### Code Quality

```bash
npm run lint                   # ESLint check
npm run lint:fix               # ESLint auto-fix
npm run format                 # Prettier format
npm run format:check           # Check formatting
```

Pre-commit hooks (husky + lint-staged) auto-run ESLint fix and Prettier on staged `.js` files.

## Core Architecture

```
Viewer (top-level API, src/Viewer.js)
  ├─ Stage (WebGL context, src/stages/WebGl.js)
  ├─ Controls (input handling, src/controls/Controls.js)
  ├─ RenderLoop (frame cycle, src/RenderLoop.js)
  └─ Scene (single panorama, src/Scene.js)
      ├─ View (camera/projection: RectilinearView, FlatView)
      ├─ Layer (Source + Geometry + View + TextureStore + Effects)
      └─ HotspotContainer (interactive elements)
```

### Rendering Pipeline

1. **RenderLoop** triggers frame via `requestAnimationFrame`
2. **Stage.render()** iterates Layers in the Scene
3. Stage coordinates with **TextureStore** via strict state machine: `startFrame()` → `markTile()` (visible tiles) → `endFrame()`
4. **TextureStore** loads missing textures async via **Source**, uses LRU cache with GPU memory budget (default 256MB)
5. **Renderer** (WebGlCube/Equirect/Flat) draws tiles with WebGL, **Effects** applied
6. Layer emits `renderComplete` with `{stable: true|false}` based on texture availability

**Critical**: Stage must call `startFrame()` and `endFrame()` equal number of times. The TextureStore state machine (IDLE → START → MARK → END → IDLE) breaks if this invariant is violated.

### Key Patterns

- **Event system**: `minimal-event-emitter` mixin — `addEventListener()`, `removeEventListener()`, `emit()`
- **Cleanup**: `clearOwnProperties()` utility + explicit `destroy()` methods
- **Tiles**: Identified by face (cube), level, x, y coordinates
- **Shaders**: In `src/shaders/`, compiled at runtime
- **Public API**: `src/index.js` — named exports for all components, `util` namespace for utilities, `dependencies` namespace exposing bowser/gl-matrix/hammerjs/eventEmitter

### Build Output

- `dist/marzipano.es.js` (ESM) + `dist/marzipano.umd.js` (UMD)
- TypeScript definitions copied from `src/*.d.ts` to `dist/types/`
- Sourcemaps enabled, minified with Terser

### Optional Features

- **WebXR** (`src/xr/`): Dynamically imported in Viewer for VR/AR
- **Audio** (`src/audio/`): Spatial audio with AudioAnchor/AudioManager
- **Transitions** (`src/transitions/`): crossfade, zoomMorph, orbitToTarget
- **WebGPU** (`src/stages/WebGpu.js`): Experimental, not production-ready
- **Tile Source Adapters** (`src/sources/TileSourceAdapter.js`): IIIF, DeepZoom, GoogleMaps

## Release Process

1. Ensure tests pass: `npm test`
2. Update CHANGELOG, bump version in package.json
3. Commit: `git commit -am "Release vX.Y.Z"`
4. Tag and push: `git tag vX.Y.Z && git push --tags`
5. GitHub Actions handles CI, release creation, and npm publish
