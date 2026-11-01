import { postDraftFrom, projectDraftFrom, toPostInput, toProjectInput } from './admin-forms';

describe('post drafts', () => {
  it('starts empty for a new post', () => {
    expect(postDraftFrom()).toEqual({ title: '', slug: '', excerpt: '', tags: '', featured: false, bodyMd: '' });
  });

  it('turns a valid draft into PostInput, splitting and slugging tags', () => {
    const result = toPostInput({ title: 'Hi', slug: 'hi', excerpt: 'e', tags: 'MuleSoft,  data weave ,', featured: true, bodyMd: 'b' });
    expect(result).toEqual({ ok: true, input: { title: 'Hi', slug: 'hi', excerpt: 'e', tags: ['mulesoft', 'data-weave'], featured: true, bodyMd: 'b' } });
  });

  it('reports the first error per field', () => {
    const result = toPostInput({ ...postDraftFrom(), slug: 'Bad Slug' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(Object.keys(result.errors).sort()).toEqual(['bodyMd', 'excerpt', 'slug', 'title']);
    expect(result.errors.slug).toMatch(/lowercase/);
  });
});

describe('project drafts', () => {
  const draft = { title: 'T', company: 'C', startMonth: '2025-07', endMonth: '', description: 'd', skills: 'DataWeave, MUnit' };

  it('treats an empty end month as ongoing and keeps skill names as typed', () => {
    expect(toProjectInput(draft)).toEqual({
      ok: true,
      input: { title: 'T', company: 'C', startMonth: '2025-07-01', endMonth: null, description: 'd', skills: ['DataWeave', 'MUnit'] },
    });
  });

  it('round-trips an existing project into month inputs', () => {
    const fromDto = projectDraftFrom({ id: 1, title: 'T', company: 'C', startMonth: '2024-01-01', endMonth: '2024-06-01', description: 'd', skills: ['A', 'B'] });
    expect(fromDto).toMatchObject({ startMonth: '2024-01', endMonth: '2024-06', skills: 'A, B' });
  });

  it('flags an end month before the start month on the end field', () => {
    const result = toProjectInput({ ...draft, endMonth: '2024-01' });
    expect(result.ok ? null : result.errors.endMonth).toMatch(/End month/);
  });
});
