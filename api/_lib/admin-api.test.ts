import { adminPost, adminPosts, adminProject, adminProjects } from './admin-api';
import { respond, type Context, type Handler } from './http';
import { createSession } from './session';
import { testContext } from './test-context';

const APP = 'http://localhost:5173';
const post = { slug: 'hello', title: 'Hello', excerpt: 'Short', bodyMd: '# Hello' };
const project = { title: 'T', company: 'C', startMonth: '2025-01', endMonth: null, description: 'd', skills: ['DataWeave'] };

let ctx: Context;
let cookie: string;
beforeEach(async () => {
  ctx = await testContext();
  cookie = `session=${await createSession(ctx.db, 'devsha256', ctx.now())}`;
});

function send(handler: Handler | undefined, path: string, method = 'GET', body?: unknown, headers: Record<string, string> = {}) {
  if (!handler) throw new Error(`no ${method} handler`);
  const init: RequestInit = { method, headers: { cookie, origin: APP, 'content-type': 'application/json', ...headers } };
  if (body !== undefined) init.body = JSON.stringify(body);
  return respond(handler, new Request(`${APP}${path}`, init), ctx);
}

describe('admin posts', () => {
  it('requires a session on every method', async () => {
    const anonymous = { cookie: '' };
    expect((await send(adminPosts.GET, '/api/admin/posts', 'GET', undefined, anonymous)).status).toBe(401);
    expect((await send(adminPosts.POST, '/api/admin/posts', 'POST', post, anonymous)).status).toBe(401);
    expect((await send(adminPost.PATCH, '/api/admin/posts/1', 'PATCH', {}, anonymous)).status).toBe(401);
    expect((await send(adminPost.DELETE, '/api/admin/posts/1', 'DELETE', undefined, anonymous)).status).toBe(401);
  });

  it('refuses a cross-origin create', async () => {
    const res = await send(adminPosts.POST, '/api/admin/posts', 'POST', post, { origin: 'https://evil.dev' });
    expect(res.status).toBe(403);
  });

  it('creates, lists drafts, publishes, and deletes idempotently', async () => {
    const created = await send(adminPosts.POST, '/api/admin/posts', 'POST', post);
    expect(created.status).toBe(201);
    const { id } = await created.json();

    const list = await send(adminPosts.GET, '/api/admin/posts');
    expect(list.headers.get('cache-control')).toBe('no-store');
    expect(await list.json()).toMatchObject({ items: [{ id, status: 'draft' }] });

    const published = await send(adminPost.PATCH, `/api/admin/posts/${id}`, 'PATCH', { status: 'published' });
    expect(await published.json()).toMatchObject({ status: 'published', publishedAt: ctx.now().toISOString() });

    expect((await send(adminPost.DELETE, `/api/admin/posts/${id}`, 'DELETE')).status).toBe(204);
    expect((await send(adminPost.DELETE, `/api/admin/posts/${id}`, 'DELETE')).status).toBe(204);
    expect((await send(adminPost.GET, `/api/admin/posts/${id}`)).status).toBe(404);
  });

  it('returns 400 with field issues for an invalid body', async () => {
    const res = await send(adminPosts.POST, '/api/admin/posts', 'POST', { ...post, slug: 'Bad Slug' });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ issues: { fieldErrors: { slug: expect.any(Array) } } });
  });

  it('returns 400 for a non-JSON body', async () => {
    const res = await respond(
      adminPosts.POST ?? (() => Promise.reject(new Error('missing'))),
      new Request(`${APP}/api/admin/posts`, { method: 'POST', headers: { cookie, origin: APP }, body: 'not json' }),
      ctx,
    );
    expect(res.status).toBe(400);
  });

  it('returns 409 for a duplicate slug', async () => {
    await send(adminPosts.POST, '/api/admin/posts', 'POST', post);
    expect((await send(adminPosts.POST, '/api/admin/posts', 'POST', post)).status).toBe(409);
  });

  it('returns 404 when patching a missing post and 400 for a bad id', async () => {
    expect((await send(adminPost.PATCH, '/api/admin/posts/999', 'PATCH', { title: 'x' })).status).toBe(404);
    expect((await send(adminPost.GET, '/api/admin/posts/abc')).status).toBe(400);
  });
});

describe('admin projects', () => {
  it('creates, edits and deletes a project', async () => {
    const created = await send(adminProjects.POST, '/api/admin/projects', 'POST', project);
    expect(created.status).toBe(201);
    const { id, startMonth } = await created.json();
    expect(startMonth).toBe('2025-01-01');

    const edited = await send(adminProject.PATCH, `/api/admin/projects/${id}`, 'PATCH', { endMonth: '2025-06' });
    expect(await edited.json()).toMatchObject({ endMonth: '2025-06-01' });

    expect(await (await send(adminProjects.GET, '/api/admin/projects')).json()).toMatchObject({ items: [{ id }] });
    expect((await send(adminProject.DELETE, `/api/admin/projects/${id}`, 'DELETE')).status).toBe(204);
  });

  it('rejects a project whose end month is before its start month', async () => {
    const res = await send(adminProjects.POST, '/api/admin/projects', 'POST', { ...project, endMonth: '2024-01' });
    expect(res.status).toBe(400);
  });

  it('rejects a patch that moves the end month before the stored start month with 400', async () => {
    const { id } = await (await send(adminProjects.POST, '/api/admin/projects', 'POST', project)).json();
    const res = await send(adminProject.PATCH, `/api/admin/projects/${id}`, 'PATCH', { endMonth: '2024-01' });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/end month/i) });
  });
});
