import { Link } from 'react-router';
import { Seo } from '../components/Seo';

export default function NotFound({ what = 'page' }: { what?: string }) {
  return (
    <section className="py-20">
      <Seo title="Not found" path={window.location.pathname} />
      <h1 className="text-4xl font-semibold tracking-tight">{what === 'page' ? 'Page not found' : `This ${what} is not here`}</h1>
      <p className="mt-4 max-w-prose text-muted">
        The address may be mistyped, or the {what} was moved or unpublished. Try the <Link to="/blog">blog</Link> or go{' '}
        <Link to="/">home</Link>.
      </p>
    </section>
  );
}

