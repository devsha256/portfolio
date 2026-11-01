import type { PostSummary, ProjectDto } from '../domain/contracts';

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
