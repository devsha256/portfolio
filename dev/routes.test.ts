import { applyRewrites, resolveRoute } from './routes';

const files = [
  'admin/posts/[id].ts',
  'admin/posts/index.ts',
  'auth/[action].ts',
  'feed/[kind].ts',
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
    { source: '/rss.xml', destination: '/api/feed/rss' },
    { source: '/((?!api/).*)', destination: '/index.html' },
  ];

  it('applies exact-path rewrites', () => {
    expect(applyRewrites('/rss.xml', rewrites)).toBe('/api/feed/rss');
  });

  it('leaves pattern rewrites to Vite (the SPA fallback)', () => {
    expect(applyRewrites('/blog/x', rewrites)).toBe('/blog/x');
  });
});
