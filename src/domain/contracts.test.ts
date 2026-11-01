import { PostInput, PostListQuery, ProjectInput } from './contracts';

const post = { slug: 'hello-world', title: 'Hello', excerpt: 'Hi', bodyMd: '# Hi' };
const project = {
  title: 'Migration',
  company: 'Accenture',
  startMonth: '2025-07',
  endMonth: null,
  description: 'Moved things',
  skills: ['DataWeave'],
};

describe('PostInput', () => {
  it('fills defaults for tags and featured', () => {
    expect(PostInput.parse(post)).toEqual({ ...post, tags: [], featured: false });
  });

  it.each(['Hello World', 'a--b', '-a', 'a_b', ''])('rejects slug %j', (slug) => {
    expect(PostInput.safeParse({ ...post, slug }).success).toBe(false);
  });

  it('rejects more than 10 tags', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `t${i}`);
    expect(PostInput.safeParse({ ...post, tags }).success).toBe(false);
  });
});

describe('PostListQuery', () => {
  it('coerces query strings and applies defaults', () => {
    expect(PostListQuery.parse({ page: '2' })).toEqual({ page: 2, limit: 10 });
  });

  it.each([{ limit: '21' }, { limit: '0' }, { page: '0' }, { page: 'x' }])('rejects %j', (query) => {
    expect(PostListQuery.safeParse(query).success).toBe(false);
  });
});

describe('ProjectInput', () => {
  it('normalises YYYY-MM months to the first day', () => {
    expect(ProjectInput.parse(project).startMonth).toBe('2025-07-01');
  });

  it('rejects an end month before the start month', () => {
    expect(ProjectInput.safeParse({ ...project, endMonth: '2025-01' }).success).toBe(false);
  });

  it('rejects an impossible month', () => {
    expect(ProjectInput.safeParse({ ...project, startMonth: '2025-13' }).success).toBe(false);
  });
});
