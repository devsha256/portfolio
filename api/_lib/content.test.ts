import type { CredentialInput } from '../../src/domain/contracts.js';
import { DEFAULT_PROFILE } from '../../src/domain/site.js';
import { content } from './content.js';
import { createCredential } from './credentials-repo.js';
import { respond, type Context } from './http.js';
import { createPost, updatePost } from './posts-repo.js';
import { saveProfile } from './profile-repo.js';
import { testContext } from './test-context.js';

const get = (ctx: Context, path: string) => respond(content, new Request(`http://localhost${path}`), ctx);

const credential = (overrides: Partial<CredentialInput>): CredentialInput => ({
  kind: 'learning',
  name: 'Course',
  authority: 'Udemy',
  issuedOn: '2024-01-01',
  image: '/img/logos/udemy.png',
  proof: `https://drive.google.com/file/d/${overrides.name ?? 'x'}/view`,
  ...overrides,
});

let ctx: Context;
beforeEach(async () => {
  ctx = await testContext();
});

describe('GET /api/content/credentials', () => {
  it('lists one kind, newest first, cached', async () => {
    await createCredential(ctx.db, credential({ name: 'Older', issuedOn: '2021-01-01' }));
    await createCredential(ctx.db, credential({ name: 'Newer', issuedOn: '2025-01-01' }));
    await createCredential(ctx.db, credential({ kind: 'certification', name: 'Cert' }));
    const res = await get(ctx, '/api/content/credentials?kind=learning');
    expect(res.status).toBe(200);
    expect(res.headers.get('vercel-cdn-cache-control')).toMatch(/^max-age=\d+/);
    const body = await res.json();
    expect(body.items.map((item: { name: string }) => item.name)).toEqual(['Newer', 'Older']);
  });

  it.each(['', '?kind=', '?kind=award', '?kind=Learning'])('rejects %j with 400', async (query) => {
    const res = await get(ctx, `/api/content/credentials${query}`);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/content/profile', () => {
  it('serves the ported default on a fresh database, cached', async () => {
    const res = await get(ctx, '/api/content/profile');
    expect(res.headers.get('vercel-cdn-cache-control')).toMatch(/^max-age=\d+/);
    expect(await res.json()).toEqual(DEFAULT_PROFILE);
  });

  it('serves the saved profile', async () => {
    await saveProfile(ctx.db, { ...DEFAULT_PROFILE, tagline: 'Edited' }, ctx.now());
    expect(await (await get(ctx, '/api/content/profile')).json()).toMatchObject({ tagline: 'Edited' });
  });
});

describe('GET /api/content/{rss,sitemap,robots}', () => {
  it('serves RSS with only published posts, cached', async () => {
    const live = await createPost(ctx.db, { slug: 'live', title: 'Live', excerpt: 'e', bodyMd: 'b', tags: [], featured: false });
    await updatePost(ctx.db, live.id, { status: 'published' }, ctx.now());
    await createPost(ctx.db, { slug: 'secret-draft', title: 'D', excerpt: 'e', bodyMd: 'b', tags: [], featured: false });
    const res = await get(ctx, '/api/content/rss');
    expect(res.headers.get('content-type')).toContain('application/rss+xml');
    expect(res.headers.get('vercel-cdn-cache-control')).toMatch(/^max-age=\d+/);
    const body = await res.text();
    expect(body).toContain('/blog/live');
    expect(body).not.toContain('secret-draft');
  });

  it.each([
    ['sitemap', 'application/xml'],
    ['robots', 'text/plain'],
  ])('serves %s as %s', async (kind, type) => {
    const res = await get(ctx, `/api/content/${kind}`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain(type);
  });

  it('does not need the OAuth secrets', async () => {
    const noSecrets = await testContext({
      env: () => {
        throw new Error('GITHUB_CLIENT_SECRET missing');
      },
    });
    const res = await get(noSecrets, '/api/content/sitemap');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('<loc>http://localhost:5173/projects</loc>');
  });
});

it.each(['atom', 'toString', 'constructor'])('returns 404 for the unknown kind %s', async (kind) => {
  expect((await get(ctx, `/api/content/${kind}`)).status).toBe(404);
});

describe('GET /api/content/health', () => {
  /** Uptime checks run every 5 minutes; touching Neon would keep it awake all month (free-tier guard). */
  const untouchableDb: Context['db'] = new Proxy(Object.create(null), {
    get() {
      throw new Error('health must not touch the database');
    },
  });

  it('reports ok without the database, uncached', async () => {
    const res = await get({ ...ctx, db: untouchableDb }, '/api/content/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json()).toEqual({ status: 'ok' });
  });
});
