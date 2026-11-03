import { z } from 'zod';
import { authorizeUrl, githubLogin } from './github-oauth.js';
import { HttpError, json, noContent, notFound, parseWith, pathParam, queryOf, type Context, type Handler } from './http.js';
import { SESSION_COOKIE, cookie, createSession, deleteSession, findSession, randomToken, readCookie, sessionCookie } from './session.js';

const STATE_COOKIE = 'oauth_state';
const STATE_SECONDS = 600;
const SAFE_METHODS = new Set(['GET', 'HEAD']);

const isAllowlisted = (login: string, ctx: Context) => login.toLowerCase() === ctx.env().ADMIN_GITHUB_LOGIN.toLowerCase();

/** The single server-side gate for every admin API. Returns the admin login or throws 401/403. */
export async function requireAdmin(request: Request, ctx: Context): Promise<{ login: string }> {
  const token = readCookie(request, SESSION_COOKIE);
  const session = token ? await findSession(ctx.db, token, ctx.now()) : null;
  if (!session) throw new HttpError(401, 'Sign in required');
  if (!isAllowlisted(session.githubLogin, ctx)) throw new HttpError(403, 'Not an admin');
  if (!SAFE_METHODS.has(request.method) && request.headers.get('origin') !== ctx.env().APP_URL) {
    throw new HttpError(403, 'Cross-origin write refused');
  }
  return { login: session.githubLogin };
}

const login: Handler = async (_request, ctx) => {
  const state = randomToken();
  const headers = new Headers({ location: authorizeUrl(ctx.env(), state) });
  headers.append('set-cookie', cookie(STATE_COOKIE, state, STATE_SECONDS, ctx.env().APP_URL));
  return new Response(null, { status: 302, headers });
};

const CallbackQuery = z.object({ code: z.string().min(1), state: z.string().min(1) });

const callback: Handler = async (request, ctx) => {
  const { code, state } = parseWith(CallbackQuery, queryOf(request));
  if (readCookie(request, STATE_COOKIE) !== state) throw new HttpError(400, 'Sign-in state mismatch; start again');
  const env = ctx.env();
  const githubUser = await githubLogin(env, code, ctx.fetch);
  if (!isAllowlisted(githubUser, ctx)) throw new HttpError(403, `${githubUser} is not allowed to administer this site`);
  const token = await createSession(ctx.db, githubUser, ctx.now());
  const headers = new Headers({ location: '/admin' });
  headers.append('set-cookie', sessionCookie(token, env.APP_URL));
  headers.append('set-cookie', cookie(STATE_COOKIE, '', 0, env.APP_URL));
  return new Response(null, { status: 302, headers });
};

const me: Handler = async (request, ctx) => {
  const admin = await requireAdmin(request, ctx);
  return json(admin, { headers: { 'cache-control': 'no-store' } });
};

const logout: Handler = async (request, ctx) => {
  const token = readCookie(request, SESSION_COOKIE);
  if (token) await deleteSession(ctx.db, token);
  return noContent({ 'set-cookie': cookie(SESSION_COOKIE, '', 0, ctx.env().APP_URL) });
};

const actions = new Map<string, Handler>(Object.entries({ login, callback, me, logout }));

/** `api/auth/[action]`: one Vercel function for login, callback, me and logout. */
export const authAction: Handler = (request, ctx) => {
  const action = actions.get(pathParam(request));
  if (!action) throw notFound('Auth action');
  return action(request, ctx);
};
