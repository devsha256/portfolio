import { Link, useSearchParams } from 'react-router';
import { PostList } from '../components/PostList';
import { Seo } from '../components/Seo';
import { useApi } from '../hooks/useApi';
import { PostPage } from '../lib/api-schemas';
import { blogHref, blogQuery, hasOlder, postsApiPath, type BlogQuery } from '../lib/blog';

function Pagination({ query, total }: { query: BlogQuery; total: number }) {
  const newer = query.page > 1;
  const older = hasOlder(query.page, total);
  if (!newer && !older) return null;
  return (
    <nav aria-label="Pagination" className="mt-8 flex justify-between">
      {newer ? <Link to={blogHref({ ...query, page: query.page - 1 })}>Newer posts</Link> : <span />}
      {older && <Link to={blogHref({ ...query, page: query.page + 1 })}>Older posts</Link>}
    </nav>
  );
}

export default function Blog() {
  const [searchParams] = useSearchParams();
  const query = blogQuery(searchParams);
  const posts = useApi(postsApiPath(query), PostPage);
  return (
    <>
      <Seo title="Blog" description="Thoughts on integration, architecture, and the craft of building software." path="/blog" />
      <h1 className="pt-12 text-5xl font-bold tracking-tight">Blog</h1>
      <p className="mt-4 mb-10 max-w-prose text-lg text-muted">
        Thoughts on integration, architecture, and the craft of building software.
      </p>
      {query.tag && (
        <p className="mb-6">
          Posts tagged <strong>#{query.tag}</strong>. <Link to="/blog">Show all posts</Link>
        </p>
      )}
      {posts.status === 'loading' && <p className="text-muted">Loading posts…</p>}
      {(posts.status === 'error' || posts.status === 'not-found') && <p>Posts could not be loaded. Refresh to try again.</p>}
      {posts.status === 'ready' && posts.data.items.length === 0 && (
        <p className="text-muted">No posts yet{query.tag ? ' with this tag' : ''}.</p>
      )}
      {posts.status === 'ready' && posts.data.items.length > 0 && (
        <>
          <PostList posts={posts.data.items} />
          <Pagination query={query} total={posts.data.total} />
        </>
      )}
    </>
  );
}
