import { cachedJson, cdnCached } from './http';

describe('public caching', () => {
  it('lets the CDN keep a copy but makes browsers revalidate every time', () => {
    const headers = new Headers(cdnCached(300));
    expect(headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');
    expect(headers.get('vercel-cdn-cache-control')).toBe('max-age=300, stale-while-revalidate=86400');
  });

  it('never lets a browser serve a stale copy after an admin edit', () => {
    const browser = cachedJson({}).headers.get('cache-control') ?? '';
    expect(browser).not.toMatch(/stale-while-revalidate|s-maxage/);
    expect(cachedJson({}).headers.get('vercel-cdn-cache-control')).toMatch(/^max-age=300\b/);
  });
});
