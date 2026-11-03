import { createPost, updatePost } from './posts-repo.js';
import { createProject } from './projects-repo.js';
import { respond, type Context } from './http.js';
import { getPublishedPost, listPublishedPosts, listPublicProjects } from './public-api.js';
import { testContext } from './test-context.js';

const url = (path: string) => new Request(`http://localhost${path}`);

let ctx: Context;
beforeEach(async () => {
  ctx = await testContext();
  const live = await createPost(ctx.db, { slug: 'live', title: 'Live', excerpt: 'e', bodyMd: '# Hi', tags: ['mulesoft'], featured: false });
  await updatePost(ctx.db, live.id, { status: 'published' }, new Date('2025-01-01T00:00:00Z'));
  await createPost(ctx.db, { slug: 'draft', title: 'Draft', excerpt: 'e', bodyMd: 'x', tags: [], featured: false });
  await createProject(ctx.db, { title: 'T', company: 'C', startMonth: '2025-01-01', endMonth: null, description: 'd', skills: [] });
});

describe('GET /api/posts', () => {
  it('returns a cached page of published summaries', async () => {
    const res = await respond(listPublishedPosts, url('/api/posts?limit=5'), ctx);
    expect(res.status).toBe(200);
    expect(res.headers.get('vercel-cdn-cache-control')).toMatch(/^max-age=\d+/);
    const body = await res.json();
    expect(body).toMatchObject({ page: 1, limit: 5, total: 1, items: [{ slug: 'live' }] });
  });

  it('rejects an out-of-range limit with 400 and the field name', async () => {
    const res = await respond(listPublishedPosts, url('/api/posts?limit=50'), ctx);
    expect(res.status).toBe(400);
    expect(JSON.stringify(await res.json())).toContain('limit');
  });
});

describe('GET /api/posts/:slug', () => {
  it('returns the full published post', async () => {
    const res = await respond(getPublishedPost, url('/api/posts/live'), ctx);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ slug: 'live', bodyMd: '# Hi' });
  });

  it.each(['draft', 'missing'])('returns 404 for %s', async (slug) => {
    const res = await respond(getPublishedPost, url(`/api/posts/${slug}`), ctx);
    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed slug', async () => {
    const res = await respond(getPublishedPost, url('/api/posts/Not%20A%20Slug'), ctx);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/projects', () => {
  it('returns cached projects', async () => {
    const res = await respond(listPublicProjects, url('/api/projects'), ctx);
    expect(res.headers.get('vercel-cdn-cache-control')).toMatch(/^max-age=\d+/);
    expect(await res.json()).toMatchObject({ items: [{ company: 'C', startMonth: '2025-01-01' }] });
  });
});

describe('respond', () => {
  it('hides unexpected errors behind a generic 500', async () => {
    const res = await respond(() => Promise.reject(new Error('db password leaked')), url('/x'), ctx);
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain('password');
  });
});
