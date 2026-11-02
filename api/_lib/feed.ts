import type { PostSummary } from '../../src/domain/contracts';
import { PUBLIC_PAGES, SITE } from '../../src/domain/site';
import { cdnCached, type Handler } from './http';
import { listPublished } from './posts-repo';

const FEED_LIMIT = 50;
const FEED_CDN_SECONDS = 3600;

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

/** Served here rather than from /public because the Sitemap line needs the absolute origin. */
export function robotsTxt(_posts: readonly PostSummary[], appUrl: string): string {
  return `User-agent: *\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${appUrl}/sitemap.xml\n`;
}

type Build = (posts: readonly PostSummary[], appUrl: string) => string;

function feedHandler(build: Build, type: string): Handler {
  return async (_request, ctx) => {
    const { items } = await listPublished(ctx.db, { page: 1, limit: FEED_LIMIT });
    return new Response(build(items, ctx.appUrl()), { headers: { 'content-type': type, ...cdnCached(FEED_CDN_SECONDS) } });
  };
}

/** Served at /rss.xml, /sitemap.xml and /robots.txt through vercel.json rewrites to api/content/[kind]. */
export const feeds: ReadonlyArray<[string, Handler]> = [
  ['rss', feedHandler(rssXml, 'application/rss+xml; charset=utf-8')],
  ['sitemap', feedHandler(sitemapXml, 'application/xml; charset=utf-8')],
  ['robots', feedHandler(robotsTxt, 'text/plain; charset=utf-8')],
];
