import { initialTheme, nextTheme } from './theme';

describe('initialTheme', () => {
  it.each([
    ['dark', false, 'dark'],
    ['light', true, 'light'],
    [null, true, 'dark'],
    [null, false, 'light'],
    ['purple', true, 'dark'],
  ] as const)('stored %s, prefers dark %s → %s', (stored, prefersDark, expected) => {
    expect(initialTheme(stored, prefersDark)).toBe(expected);
  });
});

it('nextTheme flips', () => {
  expect(nextTheme('light')).toBe('dark');
  expect(nextTheme('dark')).toBe('light');
});
