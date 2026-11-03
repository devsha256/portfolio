import type { PostSummary } from '../../src/domain/contracts.js';
import { robotsTxt, rssXml, sitemapXml } from './feed.js';

const APP = 'https://devsha256.dev';
const summary: PostSummary = {
  id: 1,
  slug: 'a-and-b',
  title: 'Tom & Jerry <script>',
  excerpt: 'Quotes "here"',
  tags: ['mulesoft'],
  featured: false,
  status: 'published',
  publishedAt: '2025-06-15T03:30:00.000Z',
  createdAt: '2025-06-01T00:00:00.000Z',
  updatedAt: '2025-06-20T00:00:00.000Z',
};

describe('rssXml', () => {
  const xml = rssXml([summary], APP);

  it('escapes titles and excerpts', () => {
    expect(xml).toContain('<title>Tom &amp; Jerry &lt;script&gt;</title>');
    expect(xml).toContain('Quotes &quot;here&quot;');
    expect(xml).not.toContain('<script>');
  });

  it('links each item to its blog page with an RFC 822 date', () => {
    expect(xml).toContain(`<link>${APP}/blog/a-and-b</link>`);
    expect(xml).toContain('<pubDate>Sun, 15 Jun 2025 03:30:00 GMT</pubDate>');
    expect(xml).toContain('<category>mulesoft</category>');
  });
});

describe('sitemapXml', () => {
  const xml = sitemapXml([summary], APP);

  it.each(['/', '/projects', '/blog', '/about', '/contact', '/credentials'])('lists the static route %s', (path) => {
    expect(xml).toContain(`<loc>${APP}${path === '/' ? '/' : path}</loc>`);
  });

  it('lists each post with its last update', () => {
    expect(xml).toContain(`<url><loc>${APP}/blog/a-and-b</loc><lastmod>2025-06-20</lastmod></url>`);
  });

  it('never lists admin routes', () => {
    expect(xml).not.toContain('/admin');
  });
});

describe('robotsTxt', () => {
  it('keeps crawlers out of admin and API routes and points at the sitemap', () => {
    const text = robotsTxt([], APP);
    expect(text).toContain('Disallow: /admin');
    expect(text).toContain('Disallow: /api/');
    expect(text).toContain(`Sitemap: ${APP}/sitemap.xml`);
  });
});
