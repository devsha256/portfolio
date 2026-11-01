/** Mirrors Vercel's filesystem routing for `/api` so local dev runs the same function files. */
export function resolveRoute(pathname: string, files: readonly string[]): string | null {
  if (!pathname.startsWith('/api/')) return null;
  const segments = pathname.slice('/api/'.length).split('/').filter(Boolean);
  if (segments.some((segment) => segment.startsWith('_'))) return null;
  const candidates = [`${segments.join('/')}.ts`, `${[...segments, 'index'].join('/')}.ts`];
  const exact = candidates.find((candidate) => files.includes(candidate));
  if (exact) return exact;
  return files.find((file) => matchesDynamic(file, segments)) ?? null;
}

function matchesDynamic(file: string, segments: readonly string[]): boolean {
  const parts = file.replace(/\.ts$/, '').split('/');
  if (parts.length !== segments.length) return false;
  return parts.every((part, i) => part === segments[i] || /^\[\w+\]$/.test(part));
}

type Rewrite = { source: string; destination: string };

/** Applies the exact-path rewrites from vercel.json; pattern rewrites (the SPA fallback) are Vite's job. */
export function applyRewrites(pathname: string, rewrites: readonly Rewrite[]): string {
  return rewrites.find((rewrite) => rewrite.source === pathname)?.destination ?? pathname;
}
