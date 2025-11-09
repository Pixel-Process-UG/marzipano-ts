# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Marzipano is a 360° media viewer for the modern web. It's a JavaScript library that uses WebGL to render panoramic images with support for multiple geometries (Cube, Equirect, Flat) and projection types.

**Key Technologies:**
- ES6 modules (ESM) with native import/export
- Vite for development and building
- Vitest for testing (Mocha-compatible API)
- WebGL for rendering
- JSDoc for documentation
- Hammer.js for touch gestures
- gl-matrix for 3D math

## Development Commands

### Setup
```bash
npm install                    # Install dependencies
npm update                     # Update dependencies
```

### Development
```bash
npm run dev                    # Start Vite dev server with HMR (Hot Module Replacement)
npm run test:watch             # Run test suite in watch mode with Vitest
npm run test:ui                # Run tests with Vitest UI
```

### Testing
```bash
npm test                       # Run all tests with Vitest
npm run test:watch             # Run tests in watch mode
npm run test:ui                # Run tests with Vitest UI
npm run coverage               # Generate test coverage report
```

**Test Architecture:**
- Test files in `test/suite/` mirror source structure
- Tests use Vitest (Mocha-compatible API) + Chai + Sinon
- Tests run in jsdom environment by default
- Tests use ES6 modules (import/export)
- `test/wait.js` provides async test helpers

### Building & Release
```bash
npm run build                  # Build production bundle with Vite
npm run preview                # Preview production build
npm run release                # Build production bundle (legacy script)
npm run deploy                 # Deploy to website
npm publish                    # Publish to npm registry
```

**Build Process:**
- Vite builds ES modules for modern browsers
- Production builds are optimized and minified
- Legacy `scripts/release` still available for backward compatibility
- JSDoc documentation can be generated separately

## Core Architecture

### Conceptual Hierarchy

```
Viewer (top-level API)
  └─ Stage (WebGL rendering context)
  └─ Controls (user input handling)
  └─ RenderLoop (frame rendering cycle)
  └─ Scene (single panorama)
      └─ View (camera/projection, e.g., RectilinearView, FlatView)
      └─ Layer (visual layer)
          └─ Source (image loading, e.g., ImageUrlSource)
          └─ Geometry (3D shape, e.g., CubeGeometry, EquirectGeometry, FlatGeometry)
          └─ TextureStore (tile/texture management)
          └─ Effects (color/visual effects)
      └─ HotspotContainer (interactive elements)
```

### Key Components

**Viewer (`src/Viewer.js`)**
- High-level API entry point
- Manages scenes, stage, controls, and render loop
- Handles scene transitions and view changes
- Emits `sceneChange` and `viewChange` events

**Scene (`src/Scene.js`)**
- Stack of layers sharing same view and hotspot container
- Belongs to viewer
- Emits `viewChange` and `layerChange` events

**Layer (`src/Layer.js`)**
- Combination of Source + Geometry + View + TextureStore
- Rendered by Stage with Effects
- Emits `renderComplete` event with stability status

**TextureStore (`src/TextureStore.js`)**
- Manages texture/tile loading, caching, and eviction
- LRU cache strategy for memory management
- State machine: IDLE → START → MARK → END
- Coordinated by Stage during frame rendering

**Stage (`src/stages/Stage.js`, `src/stages/WebGl.js`)**
- WebGL rendering context management
- RendererRegistry for geometry-specific renderers
- Coordinates with TextureStore via `startFrame`/`markTile`/`endFrame`

**View (`src/views/Rectilinear.js`, `src/views/Flat.js`)**
- Camera projection and field-of-view
- View parameters (yaw, pitch, roll, fov)
- View frustum and tile visibility determination

**Geometry (`src/geometries/`)**
- Defines 3D shape (Cube, Equirect, Flat)
- Level-of-detail tile structure
- Tile coordinates and visibility testing

**Source (`src/sources/`)**
- Image loading strategy (ImageUrl, SingleAsset)
- Provides textures to TextureStore

**Controls (`src/controls/`)**
- User input handlers (Drag, Key, Scroll, Pinch, etc.)
- Controls class coordinates multiple control methods
- Dynamics for smooth parameter interpolation

### Rendering Pipeline

1. **RenderLoop** triggers frame
2. **Stage.render()** called for each Layer
3. Stage calls **TextureStore.startFrame()**
4. Stage determines visible tiles using **View** and **Geometry**
5. Stage calls **TextureStore.markTile()** for each visible tile
6. Stage calls **TextureStore.endFrame()**
7. TextureStore loads missing textures
8. **Renderer** (WebGlCube/Equirect/Flat) draws tiles with textures
9. **Effects** applied during rendering
10. Layer emits **renderComplete** event

### Module System

- Entry point: `src/index.js` exports public API via ES6 modules
- All source files use ES6 `import`/`export` syntax
- All dependencies exposed via `Marzipano.dependencies.*`
- Utilities in `src/util/` (async, geometry math, DOM helpers, etc.)
- Collections in `src/collections/` (Map, Set, LruSet, LruMap)
- Package.json has `"type": "module"` for native ESM support

## Code Patterns

### Event Emitters
Most core classes use `minimal-event-emitter` for events:
```javascript
import eventEmitter from 'minimal-event-emitter';
eventEmitter(Constructor);
// Then: instance.addEventListener(), instance.emit()
```

### Tile Coordinate System
Tiles identified by face (cube), level, x, y coordinates. Each geometry implements tile iteration and visibility testing.

### Memory Management
- TextureStore uses LRU eviction
- `clearOwnProperties()` utility for cleanup
- Explicit `destroy()` methods on major objects

### WebGL Context
- Single shared WebGL context per Stage
- Texture units managed by Stage
- Shaders in `src/shaders/` compiled at runtime

## Important Notes

- **Browser Support**: Modern browsers with WebGL support
- **Coordinate System**: Right-handed with Y-up
- **Async Operations**: Texture loading is async; `renderComplete` event signals stability
- **No CSS Framework**: Pure JavaScript, minimal DOM manipulation
- **Math Library**: Uses gl-matrix for matrix/vector operations
- **Touch Support**: Hammer.js for multi-touch gestures

## Testing Notes

- Test files mirror source structure in `test/suite/`
- Use `describe()` and `it()` (Vitest/Mocha-compatible API)
- Tests use ES6 modules (`import`/`export`)
- Assertions with Chai's `assert` or `expect()`
- Stubs/spies with Sinon when needed
- Tests run in jsdom environment by default
- `test/wait.js` provides async test helpers
- Vitest configuration in `vitest.config.js`
