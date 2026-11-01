import { Link } from 'react-router';
import type { PostSummary } from '../domain/contracts';
import { formatDate } from '../lib/format';

export function TagLinks({ tags }: { tags: readonly string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul aria-label="Tags" className="flex flex-wrap gap-x-3 text-sm text-muted">
      {tags.map((tag) => (
        <li key={tag}>
          <Link to={`/blog?tag=${tag}`}>#{tag}</Link>
        </li>
      ))}
    </ul>
  );
}

/** One row per post: date in the margin, title, excerpt, tags. Shared by the home page and the blog. */
export function PostList({ posts }: { posts: readonly PostSummary[] }) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {posts.map((post) => (
        <li key={post.id} className="grid gap-1 py-5 sm:grid-cols-[8rem_1fr] sm:gap-6">
          <time dateTime={post.publishedAt ?? undefined} className="text-sm text-muted tabular-nums sm:pt-1">
            {post.publishedAt ? formatDate(post.publishedAt) : 'Draft'}
          </time>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold tracking-tight">
              <Link to={`/blog/${post.slug}`} className="no-underline hover:underline">
                {post.title}
              </Link>
            </h3>
            <p className="max-w-prose text-muted">{post.excerpt}</p>
            <TagLinks tags={post.tags} />
          </div>
        </li>
      ))}
    </ol>
  );
}
