import { z } from 'zod';
import { CredentialKind } from '../../src/domain/contracts';
import { listByKind } from './credentials-repo';
import { feeds } from './feed';
import { cachedJson, notFound, parseWith, pathParam, queryOf, type Handler } from './http';
import { getProfile } from './profile-repo';

const CredentialQuery = z.object({ kind: CredentialKind });

const credentials: Handler = async (request, { db }) => {
  const { kind } = parseWith(CredentialQuery, queryOf(request));
  return cachedJson({ items: await listByKind(db, kind) });
};

const profile: Handler = async (_request, { db }) => cachedJson(await getProfile(db));

const KINDS = new Map<string, Handler>([['credentials', credentials], ['profile', profile], ...feeds]);

/** `api/content/[kind]`: every public, CDN-cached read that is not a post or project, in one function. */
export const content: Handler = (request, ctx) => {
  const handler = KINDS.get(pathParam(request));
  if (!handler) throw notFound('Content');
  return handler(request, ctx);
};
