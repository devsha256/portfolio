import { PostListQuery, Slug } from '../../src/domain/contracts.js';
import { cachedJson, notFound, parseWith, pathParam, queryOf, type Handler } from './http.js';
import { getPublishedBySlug, listPublished } from './posts-repo.js';
import { listProjects } from './projects-repo.js';

export const listPublishedPosts: Handler = async (request, { db }) => {
  const query = parseWith(PostListQuery, queryOf(request));
  return cachedJson(await listPublished(db, query));
};

export const getPublishedPost: Handler = async (request, { db }) => {
  const slug = parseWith(Slug, pathParam(request));
  const post = await getPublishedBySlug(db, slug);
  if (!post) throw notFound('Post');
  return cachedJson(post);
};

export const listPublicProjects: Handler = async (_request, { db }) => cachedJson({ items: await listProjects(db) });
