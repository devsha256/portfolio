import { lazy, Suspense } from 'react';
import { Link } from 'react-router';
import { CredentialsOf } from '../components/CredentialCard';
import { Seo } from '../components/Seo';
import { Summary } from '../components/Summary';
import { collectSkills } from '../domain/project';
import { SITE } from '../domain/site';
import { useApi } from '../hooks/useApi';
import { useProfile } from '../hooks/useProfile';
import { ProjectList } from '../lib/api-schemas';

const Markdown = lazy(() => import('../components/Markdown'));

function Skills() {
  const projects = useApi('/api/projects', ProjectList);
  if (projects.status === 'loading') return <p className="text-muted">Loading skills…</p>;
  if (projects.status !== 'ready') return <p className="text-muted">Skills could not be loaded. Refresh to try again.</p>;
  return (
    <ul aria-labelledby="skills" className="flex flex-wrap gap-2">
      {collectSkills(projects.data.items).map((skill) => (
        <li key={skill.slug}>
          <Link
            to={`/projects?skill=${skill.slug}`}
            className="inline-block rounded-full border border-line px-3 py-1 text-sm no-underline hover:border-ink"
          >
            {skill.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Optional Markdown above the summary; the Markdown chunk only loads when there is something to render. */
function Intro({ markdown }: { markdown: string }) {
  if (!markdown) return null;
  return (
    <Suspense fallback={null}>
      <div className="mt-8">
        <Markdown>{markdown}</Markdown>
      </div>
    </Suspense>
  );
}

export default function About() {
  const profile = useProfile();
  return (
    <>
      <Seo title="About" path="/about" />
      <h1 className="pt-12 text-5xl font-bold tracking-tight">About</h1>
      <Intro markdown={profile.aboutMd} />
      <Summary profile={profile} className="mt-8" />
      <p className="mt-6">
        <a href={SITE.links.resume}>Download my résumé</a>
      </p>
      <section className="mt-16">
        <h2 id="skills" className="mb-5 text-2xl font-semibold tracking-tight">
          Skills
        </h2>
        <Skills />
      </section>
      <section className="mt-16">
        <h2 className="mb-5 text-2xl font-semibold tracking-tight">Certifications</h2>
        <CredentialsOf kind="certification" label="certifications" />
        <p className="mt-5">
          <Link to="/credentials">All credentials, feedback and learning history</Link>
        </p>
      </section>
    </>
  );
}
