/** Facts about the site owner and its public pages; ported from the Jekyll `_config.yml`. */
export const SITE = {
  name: 'Saddam Hossain',
  title: 'Saddam Hossain · MuleSoft integration architect',
  description:
    'MuleSoft integration and architecture consultant. Projects, certifications and notes on DataWeave, CloudHub and API-led design.',
  tagline: 'MuleSoft · Integration · Architecture',
  careerStart: '2020-02-24',
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
