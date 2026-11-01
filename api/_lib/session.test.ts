import { adminSessions } from '../../db/schema';
import type { Db } from '../../db/client';
import { testDb } from '../../db/test-db';
import { createSession, deleteSession, findSession, readCookie, sessionCookie } from './session';

const now = new Date('2026-11-01T10:00:00Z');
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

describe('sessions', () => {
  it('stores only a hash of the token', async () => {
    const token = await createSession(db, 'devsha256', now);
    const rows = await db.select().from(adminSessions);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).not.toContain(token);
    expect(rows[0]?.id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('finds a live session and expires it after 7 days', async () => {
    const token = await createSession(db, 'devsha256', now);
    expect(await findSession(db, token, days(6))).toEqual({ githubLogin: 'devsha256' });
    expect(await findSession(db, token, days(8))).toBeNull();
  });

  it('does not find an unknown token', async () => {
    expect(await findSession(db, 'nope', now)).toBeNull();
  });

  it('removes expired sessions when a new one is created', async () => {
    await createSession(db, 'devsha256', now);
    await createSession(db, 'devsha256', days(30));
    expect(await db.select().from(adminSessions)).toHaveLength(1);
  });

  it('deletes idempotently', async () => {
    const token = await createSession(db, 'devsha256', now);
    await deleteSession(db, token);
    await expect(deleteSession(db, token)).resolves.toBeUndefined();
    expect(await findSession(db, token, now)).toBeNull();
  });
});

describe('cookies', () => {
  it('builds an HttpOnly SameSite=Lax cookie, Secure only on https', () => {
    expect(sessionCookie('t', 'https://x.dev')).toMatch(/^session=t; .*HttpOnly.*SameSite=Lax.*Secure/);
    expect(sessionCookie('t', 'http://localhost:5173')).not.toContain('Secure');
  });

  it('reads one cookie out of a header', () => {
    const request = new Request('http://x', { headers: { cookie: 'a=1; session=abc%3D; b=2' } });
    expect(readCookie(request, 'session')).toBe('abc=');
    expect(readCookie(request, 'missing')).toBeNull();
  });
});
