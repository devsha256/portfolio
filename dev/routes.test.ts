import { readdirSync, readFileSync } from 'node:fs';
import { applyRewrites, resolveRoute } from './routes.js';

const files = [
  'admin/posts/[id].ts',
  'admin/posts/index.ts',
  'auth/[action].ts',
  'content/[resource].ts',
  'posts/[slug].ts',
  'posts/index.ts',
  'posts/featured.ts',
  'projects/index.ts',
  '_lib/http.ts',
];

describe('resolveRoute', () => {
  it.each([
    ['/api/posts', 'posts/index.ts'],
    ['/api/posts/', 'posts/index.ts'],
    ['/api/posts/hello-world', 'posts/[slug].ts'],
    ['/api/posts/featured', 'posts/featured.ts'],
    ['/api/admin/posts/3', 'admin/posts/[id].ts'],
    ['/api/auth/login', 'auth/[action].ts'],
  ])('%s → %s', (path, file) => {
    expect(resolveRoute(path, files)).toBe(file);
  });

  it.each(['/api/_lib/http', '/api/nope', '/api/posts/a/b', '/blog'])('%s has no function', (path) => {
    expect(resolveRoute(path, files)).toBeNull();
  });
});

describe('applyRewrites', () => {
  const rewrites = [
    { source: '/rss.xml', destination: '/api/content/rss' },
    { source: '/((?!api/).*)', destination: '/index.html' },
  ];

  it('applies exact-path rewrites', () => {
    expect(applyRewrites('/rss.xml', rewrites)).toBe('/api/content/rss');
  });

  it('leaves pattern rewrites to Vite (the SPA fallback)', () => {
    expect(applyRewrites('/blog/x', rewrites)).toBe('/blog/x');
  });
});

describe('vercel.json', () => {
  const { rewrites } = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));

  it('serves the uptime check at /api/health from the content function', () => {
    const path = applyRewrites('/api/health', rewrites);
    expect(path).toBe('/api/content/health');
    expect(resolveRoute(path, files)).toBe('content/[resource].ts');
  });
});

describe('api function files', () => {
  /** Query keys read by handlers: PostListQuery, the credentials filter and the OAuth callback. */
  const QUERY_KEYS = ['page', 'limit', 'tag', 'kind', 'code', 'state'];
  const params = readdirSync(new URL('../api', import.meta.url), { recursive: true, encoding: 'utf8' })
    .flatMap((file) => [...file.matchAll(/\[(\w+)\]/g)].map((match) => match[1] ?? ''));

  it('never name a [param] after a query key (Vercel adds the param to the query string)', () => {
    expect(params).toContain('resource');
    expect(params.filter((param) => QUERY_KEYS.includes(param))).toEqual([]);
  });
});
