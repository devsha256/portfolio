import type { PostSummary } from '../../src/domain/contracts';
import { PUBLIC_PAGES, SITE } from '../../src/domain/site';
import { notFound, pathParam, type Handler } from './http';
import { listPublished } from './posts-repo';

const FEED_LIMIT = 50;
const FEED_CACHE = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
const escapeXml = (text: string) => text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);

const postUrl = (appUrl: string, slug: string) => `${appUrl}/blog/${slug}`;

function rssItem(post: PostSummary, appUrl: string): string {
  const link = postUrl(appUrl, post.slug);
  const date = new Date(post.publishedAt ?? post.updatedAt).toUTCString();
  const categories = post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join('');
  return `<item><title>${escapeXml(post.title)}</title><link>${link}</link><guid isPermaLink="true">${link}</guid><pubDate>${date}</pubDate><description>${escapeXml(post.excerpt)}</description>${categories}</item>`;
}

export function rssXml(posts: readonly PostSummary[], appUrl: string): string {
  const channel = `<title>${escapeXml(SITE.name)}: blog</title><link>${appUrl}/blog</link><description>${escapeXml(SITE.description)}</description><language>en</language>`;
  const items = posts.map((post) => rssItem(post, appUrl)).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"><channel>${channel}${items}</channel></rss>\n`;
}

export function sitemapXml(posts: readonly PostSummary[], appUrl: string): string {
  const pages = PUBLIC_PAGES.map(({ path }) => `<url><loc>${appUrl}${path}</loc></url>`);
  const articles = posts.map(
    (post) => `<url><loc>${postUrl(appUrl, post.slug)}</loc><lastmod>${post.updatedAt.slice(0, 10)}</lastmod></url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...pages, ...articles].join('')}</urlset>\n`;
}

const FORMATS = new Map([
  ['rss', { build: rssXml, type: 'application/rss+xml; charset=utf-8' }],
  ['sitemap', { build: sitemapXml, type: 'application/xml; charset=utf-8' }],
]);

/** `api/feed/[kind]`, served at /rss.xml and /sitemap.xml through vercel.json rewrites. */
export const feed: Handler = async (request, ctx) => {
  const format = FORMATS.get(pathParam(request));
  if (!format) throw notFound('Feed');
  const { items } = await listPublished(ctx.db, { page: 1, limit: FEED_LIMIT });
  const appUrl = ctx.env().APP_URL;
  return new Response(format.build(items, appUrl), {
    headers: { 'content-type': format.type, 'cache-control': FEED_CACHE },
  });
};
