import { z } from 'zod';
import type { Db } from '../../db/client';
import { PostInput, PostPatch, ProjectInput, ProjectPatch } from '../../src/domain/contracts';
import { requireAdmin } from './auth';
import { json, noContent, notFound, parseWith, pathParam, readJson, type Handler } from './http';
import * as posts from './posts-repo';
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

const Id = z.coerce.number().int().positive();
const PRIVATE = { 'cache-control': 'no-store' };

/** Every admin handler passes requireAdmin first; nothing here is reachable without it. */
const guarded =
  (handler: Handler): Handler =>
  async (request, ctx) => {
    await requireAdmin(request, ctx);
    return handler(request, ctx);
  };

const found = (name: string, value: unknown) => {
  if (value === null) throw notFound(name);
  return json(value, { headers: PRIVATE });
};

function collection<Input, Patch>(r: Resource<Input, Patch>) {
  return {
    GET: guarded(async (_request, { db }) => json({ items: await r.list(db) }, { headers: PRIVATE })),
    POST: guarded(async (request, { db }) =>
      json(await r.create(db, await readJson(request, r.input)), { status: 201, headers: PRIVATE }),
    ),
  };
}

function item<Input, Patch>(r: Resource<Input, Patch>) {
  const id = (request: Request) => parseWith(Id, pathParam(request));
  return {
    GET: guarded(async (request, { db }) => found(r.name, await r.get(db, id(request)))),
    PATCH: guarded(async (request, { db, now }) =>
      found(r.name, await r.update(db, id(request), await readJson(request, r.patch), now())),
    ),
    DELETE: guarded(async (request, { db }) => {
      await r.remove(db, id(request));
      return noContent();
    }),
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

export const adminPosts = collection(postResource);
export const adminPost = item(postResource);
export const adminProjects = collection(projectResource);
export const adminProject = item(projectResource);
