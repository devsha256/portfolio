import { Link } from 'react-router';
import { FlowLine } from '../components/FlowLine';
import { PostList } from '../components/PostList';
import { Seo } from '../components/Seo';
import { Summary } from '../components/Summary';
import { SITE } from '../domain/site';
import { useApi } from '../hooks/useApi';
import { PostPage } from '../lib/api-schemas';

function RecentPosts() {
  const posts = useApi('/api/posts?limit=3', PostPage);
  if (posts.status !== 'ready' || posts.data.items.length === 0) return null;
  return (
    <section aria-labelledby="recent" className="mt-24">
      <h2 id="recent" className="mb-6 text-2xl font-semibold tracking-tight">
        Recent writing
      </h2>
      <PostList posts={posts.data.items} />
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Seo path="/" />
      <section className="pt-12 sm:pt-20">
        <FlowLine />
        <h1 className="text-[clamp(3rem,10vw,6.5rem)] leading-[0.95] font-bold tracking-[-0.03em]">{SITE.name}</h1>
        <p className="mt-4 text-xl text-muted">{SITE.tagline}</p>
        <Summary className="mt-10" />
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link to="/projects" className="button button--primary">
            See projects
          </Link>
          <Link to="/blog" className="button">
            Read the blog
          </Link>
          <Link to="/credentials">Credentials</Link>
        </div>
      </section>
      <RecentPosts />
    </>
  );
}
