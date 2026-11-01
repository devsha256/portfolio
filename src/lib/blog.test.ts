import { blogHref, blogQuery, hasOlder, postsApiPath } from './blog';

describe('blog query', () => {
  it('reads page and tag', () => {
    expect(blogQuery(new URLSearchParams('page=3&tag=dataweave'))).toEqual({ page: 3, tag: 'dataweave' });
  });

  it('falls back to page 1 for nonsense', () => {
    expect(blogQuery(new URLSearchParams('page=-4&tag=Bad Tag'))).toEqual({ page: 1, tag: undefined });
  });

  it('builds the API path and the page link', () => {
    expect(postsApiPath({ page: 2, tag: 'x' })).toBe('/api/posts?page=2&limit=10&tag=x');
    expect(blogHref({ page: 1, tag: undefined })).toBe('/blog');
    expect(blogHref({ page: 2, tag: 'x' })).toBe('/blog?tag=x&page=2');
  });

  it('knows when older posts exist', () => {
    expect(hasOlder(1, 10)).toBe(false);
    expect(hasOlder(1, 11)).toBe(true);
  });
});
