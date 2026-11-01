import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    pool: 'threads',
    projects: [
      {
        extends: true,
        test: { name: 'ui', environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'], setupFiles: ['src/test/setup.ts'] },
      },
      {
        extends: true,
        test: { name: 'server', environment: 'node', testTimeout: 20_000, hookTimeout: 20_000, include: ['api/**/*.test.ts', 'db/**/*.test.ts', 'dev/**/*.test.ts'] },
      },
    ],
    coverage: { include: ['src/**', 'api/**', 'db/**'], exclude: ['**/*.test.*', 'src/test/**', 'db/migrations/**'] },
  },
});
