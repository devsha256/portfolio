import { lazy, Suspense } from 'react';
import { useParams } from 'react-router';
import { TagLinks } from '../components/PostList';
import { Seo } from '../components/Seo';
import type { PostDto } from '../domain/contracts';
import { readingMinutes } from '../domain/post';
import { useApi } from '../hooks/useApi';
import { PostDetail } from '../lib/api-schemas';
import { formatDate } from '../lib/format';
import { NotFound } from './NotFound';

const Markdown = lazy(() => import('../components/Markdown'));

function Article({ post }: { post: PostDto }) {
  return (
    <article className="pt-12">
      <Seo title={post.title} description={post.excerpt} path={`/blog/${post.slug}`} type="article" />
      <header className="mb-10 max-w-[68ch] space-y-4">
        <h1 className="text-[clamp(2.25rem,6vw,3.5rem)] leading-[1.05] font-bold tracking-tight">{post.title}</h1>
        <p className="text-muted">
          {post.publishedAt && <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>}
          <span aria-hidden="true"> / </span>
          {readingMinutes(post.bodyMd)} min read
        </p>
        <TagLinks tags={post.tags} />
      </header>
      <Suspense fallback={<p className="text-muted">Loading article…</p>}>
        <Markdown>{post.bodyMd}</Markdown>
      </Suspense>
    </article>
  );
}

export default function Post() {
  const { slug = '' } = useParams();
  const post = useApi(`/api/posts/${encodeURIComponent(slug)}`, PostDetail);
  if (post.status === 'loading') return <p className="pt-12 text-muted">Loading post…</p>;
  if (post.status === 'not-found') return <NotFound what="post" />;
  if (post.status !== 'ready') return <p className="pt-12">This post could not be loaded. Refresh to try again.</p>;
  return <Article post={post.data} />;
}
