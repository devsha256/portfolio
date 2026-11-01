import { Link } from 'react-router';
import type { PostSummary } from '../domain/contracts';
import { formatDate } from '../lib/format';

/** One row per post: date in the margin, title, excerpt. Shared by the home page and the blog. */
export function PostList({ posts }: { posts: readonly PostSummary[] }) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {posts.map((post) => (
        <li key={post.id} className="grid gap-1 py-5 sm:grid-cols-[8rem_1fr] sm:gap-6">
          <time dateTime={post.publishedAt ?? undefined} className="text-sm text-muted tabular-nums sm:pt-1">
            {post.publishedAt ? formatDate(post.publishedAt) : 'Draft'}
          </time>
          <div>
            <h3 className="text-xl font-semibold tracking-tight">
              <Link to={`/blog/${post.slug}`} className="no-underline hover:underline">
                {post.title}
              </Link>
            </h3>
            <p className="mt-1 max-w-prose text-muted">{post.excerpt}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
