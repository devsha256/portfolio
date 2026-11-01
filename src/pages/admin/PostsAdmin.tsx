import { z } from 'zod';
import { Link } from 'react-router';
import { PostSummary } from '../../domain/contracts';
import { useApi } from '../../hooks/useApi';
import { formatDate } from '../../lib/format';
import { LoadNotice } from './LoadNotice';

const AdminPostList = z.object({ items: z.array(PostSummary) });

function PostTable({ posts }: { posts: readonly PostSummary[] }) {
  return (
    <table className="w-full text-left">
      <thead className="text-sm text-muted">
        <tr>
          <th className="py-2 font-medium">Title</th>
          <th className="py-2 font-medium">Status</th>
          <th className="py-2 font-medium">Last edited</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line border-t border-line">
        {posts.map((post) => (
          <tr key={post.id}>
            <td className="py-3 pr-4">
              <Link to={`/admin/posts/${post.id}`}>{post.title}</Link>
            </td>
            <td className={`py-3 pr-4 ${post.status === 'published' ? 'text-live' : 'text-muted'}`}>
              {post.status === 'published' ? 'Published' : 'Draft'}
            </td>
            <td className="py-3 text-muted tabular-nums">{formatDate(post.updatedAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PostsAdmin() {
  const posts = useApi('/api/admin/posts', AdminPostList);
  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
        <Link to="/admin/posts/new" className="button button--primary">
          New post
        </Link>
      </div>
      {posts.status !== 'ready' && <LoadNotice status={posts.status} what="posts" back="/admin" />}
      {posts.status === 'ready' && posts.data.items.length === 0 && <p className="text-muted">No posts yet. Write the first one.</p>}
      {posts.status === 'ready' && posts.data.items.length > 0 && <PostTable posts={posts.data.items} />}
    </section>
  );
}
