import { defineConfig } from 'vite';

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
      },
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
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
