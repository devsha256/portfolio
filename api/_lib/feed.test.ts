import type { PostSummary } from '../../src/domain/contracts';
import { feed, rssXml, sitemapXml } from './feed';
import { respond } from './http';
import { createPost, updatePost } from './posts-repo';
import { testContext } from './test-context';

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

describe('GET /api/feed/:kind', () => {
  it('serves RSS with only published posts, cached', async () => {
    const ctx = await testContext();
    const live = await createPost(ctx.db, { slug: 'live', title: 'Live', excerpt: 'e', bodyMd: 'b', tags: [], featured: false });
    await updatePost(ctx.db, live.id, { status: 'published' }, ctx.now());
    await createPost(ctx.db, { slug: 'secret-draft', title: 'D', excerpt: 'e', bodyMd: 'b', tags: [], featured: false });
    const res = await respond(feed, new Request('http://localhost/api/feed/rss'), ctx);
    expect(res.headers.get('content-type')).toContain('application/rss+xml');
    expect(res.headers.get('cache-control')).toMatch(/s-maxage/);
    const body = await res.text();
    expect(body).toContain('/blog/live');
    expect(body).not.toContain('secret-draft');
  });

  it('serves the sitemap as XML', async () => {
    const res = await respond(feed, new Request('http://localhost/api/feed/sitemap'), await testContext());
    expect(res.headers.get('content-type')).toContain('application/xml');
  });

  it('does not need the OAuth secrets', async () => {
    const ctx = await testContext({
      env: () => {
        throw new Error('GITHUB_CLIENT_SECRET missing');
      },
    });
    const res = await respond(feed, new Request('http://localhost/api/feed/sitemap'), ctx);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<loc>http://localhost:5173/projects</loc>');
  });

  it('returns 404 for another kind', async () => {
    expect((await respond(feed, new Request('http://localhost/api/feed/atom'), await testContext())).status).toBe(404);
  });
});
