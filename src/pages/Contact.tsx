import { Seo } from '../components/Seo';
import { SITE } from '../domain/site';
import { SOCIAL_LINKS } from '../lib/social';

export default function Contact() {
  return (
    <>
      <Seo title="Contact" description={`Contact ${SITE.name} by email, LinkedIn or GitHub.`} path="/contact" />
      <h1 className="pt-12 text-5xl font-bold tracking-tight">Contact</h1>
      <p className="mt-6 max-w-prose text-lg">Email is the quickest way to reach me.</p>
      <p className="mt-4 text-2xl font-semibold">
        <a href={`mailto:${SITE.email}`} aria-label={`Email ${SITE.email}`}>
          {SITE.email}
        </a>
      </p>
      <h2 className="mt-16 mb-4 text-xl font-semibold">Elsewhere</h2>
      <ul className="space-y-2 text-lg">
        {SOCIAL_LINKS.map((link) => (
          <li key={link.label}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
        <li>
          <a href={SITE.links.resume}>Résumé</a>
        </li>
      </ul>
    </>
  );
}
