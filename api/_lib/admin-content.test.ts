import { DEFAULT_PROFILE } from '../../src/domain/site.js';
import { adminContent, adminCredential } from './admin-api.js';
import { respond, type Context, type Handler } from './http.js';
import { createSession } from './session.js';
import { testContext } from './test-context.js';

const APP = 'http://localhost:5173';
const credential = {
  kind: 'certification',
  name: 'MuleSoft Certified Developer - Level 1',
  authority: 'MuleSoft',
  issuedOn: '2020-12-05',
  image: '/img/certifications/mcd-l1.png',
  proof: 'https://drive.google.com/file/d/a/view',
};

let ctx: Context;
let cookie: string;
beforeEach(async () => {
  ctx = await testContext();
  cookie = `session=${await createSession(ctx.db, 'devsha256', ctx.now())}`;
});

type Call = { handler: Handler | undefined; path: string; method?: string; body?: unknown; headers?: Record<string, string> };

function send({ handler, path, method = 'GET', body, headers = {} }: Call) {
  if (!handler) throw new Error(`no ${method} handler for ${path}`);
  const init: RequestInit = { method, headers: { cookie, origin: APP, 'content-type': 'application/json', ...headers } };
  if (body !== undefined && method !== 'GET') init.body = JSON.stringify(body);
  return respond(handler, new Request(`${APP}${path}`, init), ctx);
}

describe('admin content routes require the admin', () => {
  const anonymous = { cookie: '' };
  it.each([
    ['GET', '/api/admin/content/credentials'],
    ['POST', '/api/admin/content/credentials'],
    ['GET', '/api/admin/content/profile'],
    ['PUT', '/api/admin/content/profile'],
  ] as const)('%s %s without a session is 401', async (method, path) => {
    const res = await send({ handler: adminContent[method], path, method, body: {}, headers: anonymous });
    expect(res.status).toBe(401);
  });

  it.each(['GET', 'PATCH', 'DELETE'] as const)('%s /api/admin/credentials/1 without a session is 401', async (method) => {
    const res = await send({ handler: adminCredential[method], path: '/api/admin/credentials/1', method, body: {}, headers: anonymous });
    expect(res.status).toBe(401);
  });

  it('refuses a cross-origin profile write with 403', async () => {
    const res = await send({
      handler: adminContent.PUT,
      path: '/api/admin/content/profile',
      method: 'PUT',
      body: DEFAULT_PROFILE,
      headers: { origin: 'https://evil.dev' },
    });
    expect(res.status).toBe(403);
  });
});

describe('admin credentials', () => {
  it('creates, lists, edits and deletes idempotently', async () => {
    const created = await send({ handler: adminContent.POST, path: '/api/admin/content/credentials', method: 'POST', body: credential });
    expect(created.status).toBe(201);
    const { id } = await created.json();

    const list = await send({ handler: adminContent.GET, path: '/api/admin/content/credentials' });
    expect(list.headers.get('cache-control')).toBe('no-store');
    expect(await list.json()).toMatchObject({ items: [{ id, kind: 'certification', link: null }] });

    const path = `/api/admin/credentials/${id}`;
    const edited = await send({ handler: adminCredential.PATCH, path, method: 'PATCH', body: { name: 'MCD Level 1' } });
    expect(await edited.json()).toMatchObject({ id, name: 'MCD Level 1', authority: 'MuleSoft' });

    expect((await send({ handler: adminCredential.DELETE, path, method: 'DELETE' })).status).toBe(204);
    expect((await send({ handler: adminCredential.DELETE, path, method: 'DELETE' })).status).toBe(204);
    expect((await send({ handler: adminCredential.GET, path })).status).toBe(404);
  });

  it('returns 409 for the same certificate twice', async () => {
    const post = () => send({ handler: adminContent.POST, path: '/api/admin/content/credentials', method: 'POST', body: credential });
    await post();
    const res = await post();
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: 'This certificate is already listed' });
  });

  it('returns 400 with the field message for an image outside /img', async () => {
    const res = await send({
      handler: adminContent.POST,
      path: '/api/admin/content/credentials',
      method: 'POST',
      body: { ...credential, image: 'https://evil.dev/x.png' },
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ issues: { fieldErrors: { image: ['Pick an image under /img'] } } });
  });
});

describe('admin profile', () => {
  const path = '/api/admin/content/profile';

  it('reads the fallback, saves an edit and reads it back', async () => {
    expect(await (await send({ handler: adminContent.GET, path })).json()).toEqual(DEFAULT_PROFILE);
    const edited = { ...DEFAULT_PROFILE, tagline: 'Integration architect', aboutMd: 'Based in Kolkata.' };
    const saved = await send({ handler: adminContent.PUT, path, method: 'PUT', body: edited });
    expect(saved.status).toBe(200);
    expect(saved.headers.get('cache-control')).toBe('no-store');
    expect(await (await send({ handler: adminContent.GET, path })).json()).toEqual(edited);
  });

  it('rejects a summary without {years} with 400 on that field', async () => {
    const res = await send({ handler: adminContent.PUT, path, method: 'PUT', body: { ...DEFAULT_PROFILE, summaryMd: 'Ten years.' } });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({
      issues: { fieldErrors: { summaryMd: ['Keep {years} where the experience should appear'] } },
    });
  });
});

describe('admin content dispatch', () => {
  it.each(['nope', 'toString'])('returns 404 for the unknown kind %s', async (kind) => {
    expect((await send({ handler: adminContent.GET, path: `/api/admin/content/${kind}` })).status).toBe(404);
  });

  it('returns 405 for a method the kind does not support', async () => {
    const res = await send({ handler: adminContent.PUT, path: '/api/admin/content/credentials', method: 'PUT', body: {} });
    expect(res.status).toBe(405);
  });
});
