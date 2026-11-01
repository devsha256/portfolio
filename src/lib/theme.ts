export type Theme = 'light' | 'dark';

export const THEME_KEY = 'theme';

/** A saved choice wins; otherwise follow the operating system. */
export function initialTheme(stored: string | null, prefersDark: boolean): Theme {
  if (stored === 'light' || stored === 'dark') return stored;
  return prefersDark ? 'dark' : 'light';
}

export function nextTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}
