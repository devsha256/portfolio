import { PostListQuery } from '../domain/contracts';

const PAGE_SIZE = 10;

export type BlogQuery = { page: number; tag: string | undefined };

/** Reads ?page and ?tag; anything invalid falls back to the first, unfiltered page. */
export function blogQuery(params: URLSearchParams): BlogQuery {
  const parsed = PostListQuery.safeParse(Object.fromEntries(params));
  return parsed.success ? { page: parsed.data.page, tag: parsed.data.tag } : { page: 1, tag: undefined };
}

export function postsApiPath({ page, tag }: BlogQuery): string {
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (tag) params.set('tag', tag);
  return `/api/posts?${params}`;
}

export function blogHref({ page, tag }: BlogQuery): string {
  const params = new URLSearchParams();
  if (tag) params.set('tag', tag);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/blog?${query}` : '/blog';
}

export function hasOlder(page: number, total: number): boolean {
  return page * PAGE_SIZE < total;
}
