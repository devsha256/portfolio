import { z } from 'zod';
import { CredentialKind } from '../../src/domain/contracts.js';
import { listByKind } from './credentials-repo.js';
import { feeds } from './feed.js';
import { cachedJson, json, notFound, parseWith, pathParam, queryOf, type Handler } from './http.js';
import { getProfile } from './profile-repo.js';

const CredentialQuery = z.object({ kind: CredentialKind });

const credentials: Handler = async (request, { db }) => {
  const { kind } = parseWith(CredentialQuery, queryOf(request));
  return cachedJson({ items: await listByKind(db, kind) });
};

const profile: Handler = async (_request, { db }) => cachedJson(await getProfile(db));

/** Liveness for uptime checks: never opens the database, so 5-minute pings don't keep Neon awake. */
const health: Handler = async () => json({ status: 'ok' }, { headers: { 'cache-control': 'no-store' } });

const KINDS = new Map<string, Handler>([['credentials', credentials], ['profile', profile], ['health', health], ...feeds]);

/** `api/content/[kind]`: every public, CDN-cached read that is not a post or project, in one function. */
export const content: Handler = (request, ctx) => {
  const handler = KINDS.get(pathParam(request));
  if (!handler) throw notFound('Content');
  return handler(request, ctx);
};
