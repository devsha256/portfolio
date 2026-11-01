import { PostListQuery, Slug } from '../../src/domain/contracts';
import { cachedJson, notFound, parseWith, pathParam, queryOf, type Handler } from './http';
import { getPublishedBySlug, listPublished } from './posts-repo';
import { listProjects } from './projects-repo';

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
