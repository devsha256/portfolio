import { z } from 'zod';
import type { Db } from '../../db/client';
import {
  CredentialInput,
  CredentialPatch,
  PostInput,
  PostPatch,
  ProjectInput,
  ProjectPatch,
  SiteProfile,
} from '../../src/domain/contracts';
import { requireAdmin } from './auth';
import * as credentials from './credentials-repo';
import { HttpError, json, noContent, notFound, parseWith, pathParam, readJson, type Handler } from './http';
import * as posts from './posts-repo';
import { getProfile, saveProfile } from './profile-repo';
import * as projects from './projects-repo';

type Resource<Input, Patch> = {
  name: string;
  input: z.ZodType<Input>;
  patch: z.ZodType<Patch>;
  list: (db: Db) => Promise<unknown[]>;
  get: (db: Db, id: number) => Promise<unknown>;
  create: (db: Db, input: Input) => Promise<unknown>;
  update: (db: Db, id: number, patch: Patch, now: Date) => Promise<unknown>;
  remove: (db: Db, id: number) => Promise<void>;
};

type Methods = Partial<Record<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', Handler>>;

const Id = z.coerce.number().int().positive();
const PRIVATE = { 'cache-control': 'no-store' };

/**
 * Every exported admin method passes requireAdmin exactly once; nothing here is reachable without it.
 * The factories below return unguarded handlers so the content dispatcher can wrap them without checking twice.
 */
const guarded =
  (handler: Handler): Handler =>
  async (request, ctx) => {
    await requireAdmin(request, ctx);
    return handler(request, ctx);
  };

const guardCollection = (m: ReturnType<typeof collection>) => ({ GET: guarded(m.GET), POST: guarded(m.POST) });
const guardItem = (m: ReturnType<typeof item>) => ({
  GET: guarded(m.GET),
  PATCH: guarded(m.PATCH),
  DELETE: guarded(m.DELETE),
});

const found = (name: string, value: unknown) => {
  if (value === null) throw notFound(name);
  return json(value, { headers: PRIVATE });
};

function collection<Input, Patch>(r: Resource<Input, Patch>) {
  return {
    GET: (async (_request, { db }) => json({ items: await r.list(db) }, { headers: PRIVATE })) satisfies Handler,
    POST: (async (request, { db }) =>
      json(await r.create(db, await readJson(request, r.input)), { status: 201, headers: PRIVATE })) satisfies Handler,
  };
}

function item<Input, Patch>(r: Resource<Input, Patch>) {
  const id = (request: Request) => parseWith(Id, pathParam(request));
  return {
    GET: (async (request, { db }) => found(r.name, await r.get(db, id(request)))) satisfies Handler,
    PATCH: (async (request, { db, now }) =>
      found(r.name, await r.update(db, id(request), await readJson(request, r.patch), now()))) satisfies Handler,
    DELETE: (async (request, { db }) => {
      await r.remove(db, id(request));
      return noContent();
    }) satisfies Handler,
  };
}

/** One record with no id, such as the site profile: read it, or replace it whole. */
const profile = {
  GET: (async (_request, { db }) => json(await getProfile(db), { headers: PRIVATE })) satisfies Handler,
  PUT: (async (request, { db, now }) =>
    json(await saveProfile(db, await readJson(request, SiteProfile), now()), { headers: PRIVATE })) satisfies Handler,
};

/** `[kind]` routing inside one function: unknown kinds are 404, unsupported methods 405. */
function byKind(kinds: ReadonlyMap<string, Methods>, method: keyof Methods): Handler {
  return (request, ctx) => {
    const methods = kinds.get(pathParam(request));
    if (!methods) throw notFound('Content');
    const handler = methods[method];
    if (!handler) throw new HttpError(405, `${method} is not supported here`);
    return handler(request, ctx);
  };
}

const postResource: Resource<PostInput, PostPatch> = {
  name: 'Post',
  input: PostInput,
  patch: PostPatch,
  list: posts.listAll,
  get: posts.getPost,
  create: posts.createPost,
  update: posts.updatePost,
  remove: posts.deletePost,
};

const projectResource: Resource<ProjectInput, ProjectPatch> = {
  name: 'Project',
  input: ProjectInput,
  patch: ProjectPatch,
  list: projects.listProjects,
  get: projects.getProject,
  create: projects.createProject,
  update: projects.updateProject,
  remove: projects.deleteProject,
};

const credentialResource: Resource<CredentialInput, CredentialPatch> = {
  name: 'Credential',
  input: CredentialInput,
  patch: CredentialPatch,
  list: credentials.listAllCredentials,
  get: credentials.getCredential,
  create: credentials.createCredential,
  update: credentials.updateCredential,
  remove: credentials.deleteCredential,
};

const CONTENT_KINDS = new Map<string, Methods>([
  ['credentials', collection(credentialResource)],
  ['profile', profile],
]);

export const adminPosts = guardCollection(collection(postResource));
export const adminPost = guardItem(item(postResource));
export const adminProjects = guardCollection(collection(projectResource));
export const adminProject = guardItem(item(projectResource));
export const adminCredential = guardItem(item(credentialResource));
export const adminContent = {
  GET: guarded(byKind(CONTENT_KINDS, 'GET')),
  POST: guarded(byKind(CONTENT_KINDS, 'POST')),
  PUT: guarded(byKind(CONTENT_KINDS, 'PUT')),
};
