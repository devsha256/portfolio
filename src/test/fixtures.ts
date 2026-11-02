import type { CredentialDto, PostSummary, ProjectDto } from '../domain/contracts';

export function postSummary(overrides: Partial<PostSummary> = {}): PostSummary {
  return {
    id: 1,
    slug: 'dataweave-deep-dive',
    title: 'DataWeave Deep Dive',
    excerpt: 'Patterns for complex JSON.',
    tags: ['dataweave'],
    featured: false,
    status: 'published',
    publishedAt: '2025-06-15T03:30:00.000Z',
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-15T03:30:00.000Z',
    ...overrides,
  };
}

export function project(overrides: Partial<ProjectDto> = {}): ProjectDto {
  return {
    id: 1,
    title: 'Boomi to MuleSoft migration',
    company: 'Accenture',
    startMonth: '2025-07-01',
    endMonth: null,
    description: 'Moved nine modules.',
    skills: ['DataWeave', 'Boomi'],
    ...overrides,
  };
}

export const page = <T,>(items: T[]) => ({ items, page: 1, limit: 10, total: items.length });

export function credential(overrides: Partial<CredentialDto> = {}): CredentialDto {
  const id = overrides.id ?? 1;
  return {
    id,
    kind: 'certification',
    name: 'MuleSoft Certified Developer - Level 2',
    authority: 'MuleSoft',
    issuedOn: '2022-07-31',
    credentialId: 'MCD-L2',
    image: '/img/certifications/mcd-l2.png',
    link: 'https://trailhead.salesforce.com/en/credentials/mulesoftdeveloperii',
    proof: `https://drive.google.com/file/d/${id}/view`,
    ...overrides,
  };
}

/** `count` learning entries, newest first, named "Course 1"… so tests can page and search them. */
export function learningHistory(count: number): CredentialDto[] {
  return Array.from({ length: count }, (_, i) =>
    credential({ id: 100 + i, kind: 'learning', name: `Course ${i + 1}`, authority: 'Udemy', credentialId: null, link: null }),
  );
}
