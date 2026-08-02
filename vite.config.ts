import { defineConfig } from 'vitest/config';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Hidden sourcemaps are excluded from deployed chunks but uploaded to
    // an error-tracking service so production stack traces are readable.
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        // F1: Split stable vendor libraries into separately-cached chunks.
        // Reduces the main entry bundle from ~600 KB to ~150-200 KB.
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'vendor-ui': [
            'lucide-react',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          'vendor-forms': ['react-hook-form', 'zod', '@hookform/resolvers'],
        },
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: ['app.cloudanzen.com'],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/tests/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json-summary', 'html', 'lcov'],
      // Whole logic layer, not a per-file allowlist. Page components are
      // excluded: 269 files / ~90k lines of largely untested UI would swamp
      // the denominator and make the ratchet unmovable. Covering those needs
      // component tests, which is a separate effort.
      include: [
        'src/lib/**',
        'src/hooks/**',
        'src/services/**',
        'src/app/features/**',
        'src/app/components/**',
      ],
      // Ratchet — raise these as coverage lands, never lower them.
      //
      // The numbers dropped on 2026-08-02 when `include` was widened from a
      // 9-path allowlist to the whole logic layer. That is a re-baseline
      // against a ~2x larger denominator (1933 -> 3722 statements), NOT a
      // relaxation: the previous gate could not see new code added outside
      // its allowlist, and this one can.
      //
      // History (statements/branches/functions/lines):
      //   17/20/14/17  original, narrow allowlist
      //   25/30/18/24  after the service query-param tests, same allowlist
      //   16/14/12/16  same tests, widened include — actuals 16.79/14.62/
      //                13.09/16.54
      thresholds: {
        lines: 16,
        functions: 12,
        branches: 14,
        statements: 16,
      },
    },
  },
});
