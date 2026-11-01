import { testDb } from '../../db/test-db';
import type { Context } from './http';

export const TEST_ENV = {
  DATABASE_URL: 'pglite://memory',
  GITHUB_CLIENT_ID: 'client-id',
  GITHUB_CLIENT_SECRET: 'client-secret',
  ADMIN_GITHUB_LOGIN: 'devsha256',
  APP_URL: 'http://localhost:5173',
};

/** A request context backed by a fresh in-memory database and a fixed clock. */
export async function testContext(overrides: Partial<Context> = {}): Promise<Context> {
  return {
    db: await testDb(),
    env: () => TEST_ENV,
    now: () => new Date('2026-11-01T10:00:00Z'),
    fetch: () => Promise.reject(new Error('Unexpected network call')),
    ...overrides,
  };
}
