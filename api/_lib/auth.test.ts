import { adminSessions } from '../../db/schema.js';
import { authAction, requireAdmin } from './auth.js';
import { respond, type Context } from './http.js';
import { createSession } from './session.js';
import { testContext } from './test-context.js';

const APP = 'http://localhost:5173';

function githubReturning(login: string): typeof fetch {
  return async (input) => {
    const target = String(input instanceof Request ? input.url : input);
    if (target.startsWith('https://github.com/login/oauth/access_token')) return Response.json({ access_token: 'gho_x' });
    if (target === 'https://api.github.com/user') return Response.json({ login, id: 1 });
    throw new Error(`unexpected ${target}`);
  };
}

const call = (ctx: Context, path: string, init: RequestInit = {}) =>
  respond(authAction, new Request(`${APP}${path}`, init), ctx);
const cookies = (res: Response) => res.headers.getSetCookie().join('\n');

async function signedIn(ctx: Context) {
  return `session=${await createSession(ctx.db, 'devsha256', ctx.now())}`;
}

describe('GET /api/auth/login', () => {
  it('redirects to GitHub with a state that is also set as a cookie', async () => {
    const res = await call(await testContext(), '/api/auth/login');
    expect(res.status).toBe(302);
    const location = new URL(res.headers.get('location') ?? '');
    expect(location.origin + location.pathname).toBe('https://github.com/login/oauth/authorize');
    expect(location.searchParams.get('redirect_uri')).toBe(`${APP}/api/auth/callback`);
    const state = location.searchParams.get('state');
    expect(state).toMatch(/^[\w-]{20,}$/);
    expect(cookies(res)).toContain(`oauth_state=${state}`);
  });
});

describe('GET /api/auth/callback', () => {
  const callback = (ctx: Context, state = 's1', cookieState = 's1') =>
    call(ctx, `/api/auth/callback?code=c&state=${state}`, { headers: { cookie: `oauth_state=${cookieState}` } });

  it('rejects a state mismatch with 400 before calling GitHub', async () => {
    const res = await callback(await testContext(), 's1', 's2');
    expect(res.status).toBe(400);
  });

  it('refuses a non-allowlisted login with 403 and creates no session', async () => {
    const ctx = await testContext({ fetch: githubReturning('someone-else') });
    const res = await callback(ctx);
    expect(res.status).toBe(403);
    expect(await ctx.db.select().from(adminSessions)).toHaveLength(0);
    expect(cookies(res)).not.toMatch(/(^|\n)session=[^;]/);
  });

  it('signs in the allowlisted login (case-insensitive) and redirects to /admin', async () => {
    const ctx = await testContext({ fetch: githubReturning('DevSha256') });
    const res = await callback(ctx);
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/admin');
    expect(cookies(res)).toMatch(/(^|\n)session=[\w-]{40,};/);
    expect(await ctx.db.select().from(adminSessions)).toHaveLength(1);
  });

  it('returns 401 when GitHub rejects the code', async () => {
    const ctx = await testContext({ fetch: async () => Response.json({ error: 'bad_verification_code' }) });
    expect((await callback(ctx)).status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the login for a valid session, uncached', async () => {
    const ctx = await testContext();
    const res = await call(ctx, '/api/auth/me', { headers: { cookie: await signedIn(ctx) } });
    expect(await res.json()).toEqual({ login: 'devsha256' });
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('returns 401 without a session', async () => {
    expect((await call(await testContext(), '/api/auth/me')).status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the session and is idempotent', async () => {
    const ctx = await testContext();
    const init = { method: 'POST', headers: { cookie: await signedIn(ctx), origin: APP } };
    const first = await call(ctx, '/api/auth/logout', init);
    expect(first.status).toBe(204);
    expect(cookies(first)).toMatch(/session=; .*Max-Age=0/);
    expect((await call(ctx, '/api/auth/logout', init)).status).toBe(204);
    expect(await ctx.db.select().from(adminSessions)).toHaveLength(0);
  });
});

it.each(['nope', 'toString', 'constructor'])('returns 404 for the unknown action %s', async (action) => {
  expect((await call(await testContext(), `/api/auth/${action}`)).status).toBe(404);
});

describe('requireAdmin', () => {
  const guarded = (ctx: Context, init: RequestInit) =>
    respond(
      async (req, c) => Response.json(await requireAdmin(req, c)),
      new Request(`${APP}/api/admin/posts`, init),
      ctx,
    );

  it('returns 401 without a cookie', async () => {
    expect((await guarded(await testContext(), {})).status).toBe(401);
  });

  it('returns 403 when the session login is no longer allowlisted', async () => {
    const ctx = await testContext();
    const cookie = `session=${await createSession(ctx.db, 'old-admin', ctx.now())}`;
    expect((await guarded(ctx, { headers: { cookie } })).status).toBe(403);
  });

  it('returns 403 for a write from another origin', async () => {
    const ctx = await testContext();
    const res = await guarded(ctx, { method: 'POST', headers: { cookie: await signedIn(ctx), origin: 'https://evil.dev' } });
    expect(res.status).toBe(403);
  });

  it('allows a same-origin write and a read', async () => {
    const ctx = await testContext();
    const cookie = await signedIn(ctx);
    expect((await guarded(ctx, { method: 'POST', headers: { cookie, origin: APP } })).status).toBe(200);
    expect(await (await guarded(ctx, { headers: { cookie } })).json()).toEqual({ login: 'devsha256' });
  });
});
