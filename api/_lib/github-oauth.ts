import { z } from 'zod';
import type { Env } from './env';
import { HttpError } from './http';

const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const TOKEN_URL = 'https://github.com/login/oauth/access_token';
const USER_URL = 'https://api.github.com/user';

const TokenResponse = z.object({ access_token: z.string().min(1) });
const GithubProfile = z.object({ login: z.string().min(1), id: z.number() });

type OAuthEnv = Pick<Env, 'GITHUB_CLIENT_ID' | 'GITHUB_CLIENT_SECRET' | 'APP_URL'>;

const callbackUrl = (env: OAuthEnv) => `${env.APP_URL}/api/auth/callback`;

/** No scopes: reading the public profile is enough to learn the login. */
export function authorizeUrl(env: OAuthEnv, state: string): string {
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: callbackUrl(env),
    state,
    allow_signup: 'false',
  });
  return `${AUTHORIZE_URL}?${params}`;
}

/** Exchanges the OAuth code and returns the GitHub login; any GitHub-side failure is a 401. */
export async function githubLogin(env: OAuthEnv, code: string, fetcher: typeof fetch): Promise<string> {
  const tokenRes = await fetcher(TOKEN_URL, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl(env),
    }),
  });
  const token = TokenResponse.safeParse(await tokenRes.json());
  if (!token.success) throw new HttpError(401, 'GitHub rejected the sign-in');
  const userRes = await fetcher(USER_URL, {
    headers: { authorization: `Bearer ${token.data.access_token}`, accept: 'application/vnd.github+json', 'user-agent': 'portfolio-admin' },
  });
  const profile = GithubProfile.safeParse(await userRes.json());
  if (!profile.success) throw new HttpError(401, 'Could not read the GitHub profile');
  return profile.data.login;
}
