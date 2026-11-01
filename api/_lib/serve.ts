import { openDatabase, type Database } from '../../db/client';
import { readAppUrl, readDatabaseUrl, readEnv } from './env';
import { json, respond, type Context, type Handler } from './http';

/**
 * Connection reuse only, not application state: Neon HTTP clients are stateless, and the local PGlite
 * directory must not be opened twice by one dev server.
 */
const databases = new Map<string, Promise<Database>>();

function databaseFor(url: string): Promise<Database> {
  const existing = databases.get(url);
  if (existing) return existing;
  const opened = openDatabase(url);
  databases.set(url, opened);
  return opened;
}

async function productionContext(): Promise<Context> {
  const { db } = await databaseFor(readDatabaseUrl());
  return { db, env: () => readEnv(), appUrl: () => readAppUrl(), now: () => new Date(), fetch: (input, init) => fetch(input, init) };
}

/** Adapts a handler to a Vercel Web-standard function export (`export const GET = serve(...)`). */
export function serve(handler: Handler) {
  return async (request: Request): Promise<Response> => {
    let ctx: Context;
    try {
      ctx = await productionContext();
    } catch (error) {
      console.error(error);
      return json({ error: 'Internal error' }, { status: 500 });
    }
    return respond(handler, request, ctx);
  };
}
