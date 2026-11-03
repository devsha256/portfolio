import { mkdir } from 'node:fs/promises';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema.js';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
export type Database = { db: Db; migrate: () => Promise<void>; close: () => Promise<void> };

const PGLITE_PREFIX = 'pglite://';
const MIGRATIONS = { migrationsFolder: new URL('./migrations', import.meta.url).pathname.replace(/^\/(\w:)/, '$1') };

/**
 * Opens a database from DATABASE_URL.
 * `pglite://memory` or `pglite://<dir>` runs Postgres in-process (local dev and tests).
 * Anything else is a Neon connection string over HTTP (stateless, serverless-safe).
 */
export async function openDatabase(url: string): Promise<Database> {
  if (url.startsWith(PGLITE_PREFIX)) return openPglite(url.slice(PGLITE_PREFIX.length));
  const { neon } = await import('@neondatabase/serverless');
  const { drizzle } = await import('drizzle-orm/neon-http');
  const { migrate } = await import('drizzle-orm/neon-http/migrator');
  const db = drizzle(neon(url), { schema });
  return { db, migrate: () => migrate(db, MIGRATIONS), close: async () => undefined };
}

async function openPglite(location: string): Promise<Database> {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  if (location !== 'memory') await mkdir(location, { recursive: true });
  const client = location === 'memory' ? new PGlite() : new PGlite(location);
  const db = drizzle(client, { schema });
  return { db, migrate: () => migrate(db, MIGRATIONS), close: () => client.close() };
}
