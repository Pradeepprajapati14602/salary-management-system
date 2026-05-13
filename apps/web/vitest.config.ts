import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig as defineViteConfig, mergeConfig } from 'vite';
import { defineConfig as defineVitestConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const dir = path.dirname(fileURLToPath(import.meta.url));

const viteConfig = defineViteConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@salary-mgmt/shared': path.resolve(dir, '../../packages/shared/src/index.ts'),
    },
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
});

export default mergeConfig(
  viteConfig,
  defineVitestConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    },
  }),
);
