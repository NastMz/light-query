// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}', '__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'build'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['node_modules', 'dist', 'build'],
      all: true,
      skipFull: true,
    },
    alias: {
      '@': '/src',
      '@core': '/src/core',
      '@hooks': '/src/hooks',
      '@mocks': '/src/mocks',
      '@types': '/src/types',
      '@utils': '/src/utils',
      '@react': '/src/react',
      '@test-utils': '/src/test-utils',
    },
    watch: false
  },
});
