import { z } from 'zod';
import type { Db } from '../../db/client.js';
import type { Env } from './env.js';
import { ConflictError, InvalidError } from './errors.js';

export type Context = {
  db: Db;
  env: () => Env;
  appUrl: () => string;
  now: () => Date;
  fetch: typeof fetch;
};

export type Handler = (request: Request, ctx: Context) => Promise<Response>;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly issues?: unknown,
  ) {
    super(message);
  }
}

const PUBLIC_CDN_SECONDS = 300;

/**
 * The CDN may keep and serve a copy (free-tier guard), but browsers must revalidate every time:
 * `stale-while-revalidate` in Cache-Control would let a browser show the old text right after an admin edit.
 * Vercel's edge reads Vercel-CDN-Cache-Control and does not forward it to browsers.
 */
export function cdnCached(seconds: number): Record<string, string> {
  return {
    'cache-control': 'public, max-age=0, must-revalidate',
    'vercel-cdn-cache-control': `max-age=${seconds}, stale-while-revalidate=86400`,
  };
}

export function json(data: unknown, init: ResponseInit = {}): Response {
  return Response.json(data, init);
}

/** Public reads are cached at the CDN so most visits never wake the database (free-tier guard). */
export function cachedJson(data: unknown): Response {
  return json(data, { headers: cdnCached(PUBLIC_CDN_SECONDS) });
}

export function noContent(headers?: HeadersInit): Response {
  return new Response(null, { status: 204, ...(headers && { headers }) });
}

export function parseWith<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) throw new HttpError(400, 'Invalid request', z.flattenError(result.error));
  return result.data;
}

export async function readJson<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  const body: unknown = await request.json().catch(() => {
    throw new HttpError(400, 'Request body must be JSON');
  });
  return parseWith(schema, body);
}

export function queryOf(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams);
}

/**
 * The `[param]` of a Vercel dynamic route file. Vercel puts it in the query string, which also holds behind a
 * vercel.json rewrite (the path stays `/rss.xml`); the local dev server only has it as the last path segment.
 */
export function pathParam(request: Request, name: string): string {
  const url = new URL(request.url);
  const segment = url.pathname.split('/').filter(Boolean).at(-1) ?? '';
  return url.searchParams.get(name) ?? decodeURIComponent(segment);
}

export function notFound(what: string): HttpError {
  return new HttpError(404, `${what} not found`);
}

/** Runs a handler and maps known failures to HTTP; unknown errors become a generic 500. */
export async function respond(handler: Handler, request: Request, ctx: Context): Promise<Response> {
  try {
    return await handler(request, ctx);
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message, issues: error.issues }, { status: error.status });
    if (error instanceof ConflictError) return json({ error: error.message }, { status: 409 });
    if (error instanceof InvalidError) return json({ error: error.message }, { status: 400 });
    console.error(error);
    return json({ error: 'Internal error' }, { status: 500 });
  }
}
