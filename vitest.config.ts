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
        test: { name: 'dom', environment: 'happy-dom', testTimeout: 20_000, isolate: false, fileParallelism: false, sequence: { groupOrder: 1 }, include: ['src/**/*.test.tsx'], setupFiles: ['src/test/setup.ts'] },
      },
      {
        extends: true,
        test: { name: 'node', environment: 'node', testTimeout: 20_000, hookTimeout: 20_000, include: ['**/*.test.ts'], exclude: ['node_modules/**', '.stryker-tmp/**', 'dist/**', 'coverage/**', 'reports/**'] },
      },
    ],
    coverage: { include: ['src/**', 'api/**', 'db/**'], exclude: ['**/*.test.*', 'src/test/**', 'db/migrations/**'] },
  },
});
