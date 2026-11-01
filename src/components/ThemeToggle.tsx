import { useEffect, useState } from 'react';
import { THEME_KEY, initialTheme, nextTheme, type Theme } from '../lib/theme';

function readTheme(): Theme {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  return initialTheme(localStorage.getItem(THEME_KEY), prefersDark);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState(readTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  function toggle() {
    const next = nextTheme(theme);
    localStorage.setItem(THEME_KEY, next);
    setTheme(next);
  }

  return (
    <button type="button" className="theme-toggle" aria-pressed={theme === 'dark'} onClick={toggle}>
      <span className="sr-only">Dark theme</span>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
        <circle cx="12" cy="12" r="5" fill="currentColor" />
        <path d="M12 7a5 5 0 0 0 0 10z" className="theme-toggle__half" />
      </svg>
    </button>
  );
}
