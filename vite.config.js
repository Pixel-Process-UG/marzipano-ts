import { defineConfig } from 'vite';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const banner = `// Marzipano-TS - a 360° media viewer for the modern web (v${pkg.version})
// Copyright 2016 Google Inc. All rights reserved.
// Licensed under the Apache License, Version 2.0`;

export default defineConfig({
  // Development server configuration
  server: {
    port: 8080,
    open: false,
    cors: true,
  },

  // Build configuration for library
  build: {
    lib: {
      entry: import.meta.dirname + '/src/index.js',
      name: 'MarzipanoTS',
      formats: ['es', 'umd'],
      fileName: (format) => `marzipano.${format}.js`,
    },
    rollupOptions: {
      // Externalize dependencies that shouldn't be bundled
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
        // Preserve the original export structure
        exports: 'named',
        // Version banner
        banner,
      },
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
      format: {
        preamble: banner,
      },
    },
  },

  // Resolve configuration
  resolve: {
    extensions: ['.js', '.json'],
  },

  // Optimization
  optimizeDeps: {
    include: ['bowser', 'gl-matrix', 'hammerjs', 'minimal-event-emitter'],
  },
});
