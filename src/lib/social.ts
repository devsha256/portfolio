import { SITE } from '../domain/site';

export const SOCIAL_LINKS = [
  { label: 'GitHub', href: SITE.links.github },
  { label: 'LinkedIn', href: SITE.links.linkedin },
  { label: 'YouTube', href: SITE.links.youtube },
] as const;
