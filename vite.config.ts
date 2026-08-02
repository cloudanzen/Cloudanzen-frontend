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
      include: [
        'src/app/features/security-quest/lib/**',
        'src/lib/rbac/**',
        'src/lib/queryKeys.ts',
        'src/hooks/useCurrentUser.ts',
        'src/app/components/rbac/**',
        'src/app/features/notifications/notificationHelpers.ts',
        'src/server/frameworks/coverageEngine.ts',
        'src/server/middleware/**',
        'src/server/tests/**',
        'src/server/integrations/**',
        'src/services/api/**',
      ],
      // Ratchet — raise these as coverage lands, never lower them.
      // 2026-08-02: 17/14/20/17 -> 24/18/30/25 after the service
      // query-param tests. Actuals at the time: 25.71 stmts, 31.35 branches,
      // 18.6 funcs, 25.09 lines.
      thresholds: {
        lines: 24,
        functions: 18,
        branches: 30,
        statements: 25,
      },
    },
  },
});
