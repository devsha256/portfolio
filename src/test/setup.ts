import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';

// The DOM project shares one module graph across files (isolate: false), so Testing Library's
// automatic cleanup only registers once; register it explicitly for every file.
afterEach(() => {
  cleanup();
});
