import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',

    // Global test setup
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.js'],
      exclude: [
        'src/jsdoc-extras.js',
        'src/preamble.js',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },

    // Test file patterns
    include: ['test/suite/**/*.js'],
    exclude: ['test/suite/**/WorkCommon.js', 'test/suite/loaders/HtmlImage.js', 'node_modules/**', 'dist/**'],

    // Setup files
    setupFiles: [],

    // Test timeout
    testTimeout: 10000,

    // Suppress warnings for done() callback usage
    // These tests still pass correctly
    onConsoleLog: () => false,

    // Mocha-compatible API
    // This allows us to use describe/it/before/after etc.
    api: {
      port: 7357,
    },

    // Reporter
    reporter: ['verbose'],

    // Watch mode configuration
    watch: false,
  },

  resolve: {
    extensions: ['.js', '.json'],
  },
});
