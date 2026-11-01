import { Link } from 'react-router';
import { Seo } from '../components/Seo';
import { CredentialCard } from '../components/CredentialCard';
import { Summary } from '../components/Summary';
import { certifications } from '../content/certifications';
import { collectSkills } from '../domain/project';
import { SITE } from '../domain/site';
import { useApi } from '../hooks/useApi';
import { ProjectList } from '../lib/api-schemas';

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

function Certifications() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {certifications.map((cert) => (
        <li key={cert.id}>
          <CredentialCard credential={cert} />
        </li>
      ))}
    </ul>
  );
}

export default function About() {
  return (
    <>
      <Seo title="About" path="/about" />
      <h1 className="pt-12 text-5xl font-bold tracking-tight">About</h1>
      <Summary className="mt-8" />
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
        <Certifications />
        <p className="mt-5">
          <Link to="/credentials">All credentials, feedback and learning history</Link>
        </p>
      </section>
    </>
  );
}
