import type { SiteProfile } from './contracts.js';

/** Facts about the site owner and its public pages; ported from the Jekyll `_config.yml`. */
export const SITE = {
  name: 'Saddam Hossain',
  title: 'Saddam Hossain · MuleSoft integration architect',
  description:
    'MuleSoft integration and architecture consultant. Projects, certifications and notes on DataWeave, CloudHub and API-led design.',
  email: 'dev.hsaddam@gmail.com',
  github: 'devsha256',
  links: {
    github: 'https://github.com/devsha256',
    linkedin: 'https://www.linkedin.com/in/hsaddam',
    youtube: 'https://www.youtube.com/@tea-verse',
    resume: 'https://drive.google.com/file/d/17QT4UYfgNcnS8uLmO_vOnwcSDOq1QAWy/view?usp=sharing',
  },
} as const;

/** Public pages in navigation order; the sitemap and the header both read this list. */
export const PUBLIC_PAGES = [
  { path: '/', label: 'Home' },
  { path: '/projects', label: 'Projects' },
  { path: '/blog', label: 'Blog' },
  { path: '/credentials', label: 'Credentials' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
] as const;

/**
 * Fallback and seed source for the editable profile (Home tagline, summary, About intro).
 * Summary ported verbatim from summaries.yml; the duplicated "years" after {years} is dropped.
 */
export const DEFAULT_PROFILE: SiteProfile = {
  tagline: 'MuleSoft · Integration · Architecture',
  careerStart: '2020-02-24',
  summaryMd: [
    `With over {years} of experience specializing in API integration, particularly with technologies like MuleSoft, I have developed strong skills in software development. Along the way, I've earned industry-recognized certifications, including those in MuleSoft Development and Anypoint Platform Architecture. While MuleSoft has been central to my career, my experience extends beyond it. In my current organization, I am also an "Elevated Wings1 Certified - Full-Stack JavaScript Developer (MERN)," a program that deepened my expertise in integration patterns using JavaScript.`,
    `Automation has helped drive to my success, especially in testing—be it automated testing. I'm well-versed in various architectural patterns, including Pub/Sub and streaming pipelines. Happy to discuss potential projects!`,
  ].join('\n\n'),
  aboutMd: '',
};
