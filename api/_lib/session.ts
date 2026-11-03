import { eq, lt } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { adminSessions } from '../../db/schema.js';

export const SESSION_COOKIE = 'session';
const SESSION_DAYS = 7;
const SESSION_SECONDS = SESSION_DAYS * 86_400;

export function randomToken(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
}

/** Only this hash is stored, so a leaked table cannot be replayed as cookies. */
async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Buffer.from(digest).toString('hex');
}

export async function createSession(db: Db, githubLogin: string, now: Date): Promise<string> {
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, now));
  const token = randomToken();
  const expiresAt = new Date(now.getTime() + SESSION_SECONDS * 1000);
  await db.insert(adminSessions).values({ id: await hashToken(token), githubLogin, expiresAt });
  return token;
}

export async function findSession(db: Db, token: string, now: Date): Promise<{ githubLogin: string } | null> {
  const [row] = await db.select().from(adminSessions).where(eq(adminSessions.id, await hashToken(token)));
  return row && row.expiresAt > now ? { githubLogin: row.githubLogin } : null;
}

export async function deleteSession(db: Db, token: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.id, await hashToken(token)));
}

export function cookie(name: string, value: string, maxAgeSeconds: number, appUrl: string): string {
  const secure = appUrl.startsWith('https://') ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; SameSite=Lax${secure}`;
}

export function sessionCookie(token: string, appUrl: string): string {
  return cookie(SESSION_COOKIE, token, SESSION_SECONDS, appUrl);
}

export function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return null;
}
