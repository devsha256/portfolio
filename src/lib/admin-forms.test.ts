import { KNOWN_IMAGES } from './images';
import { credentialDraftFrom, postDraftFrom, projectDraftFrom, toCredentialInput, toPostInput, toProfileInput, toProjectInput } from './admin-forms';
import { DEFAULT_PROFILE } from '../domain/site';

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

describe('credential drafts', () => {
  const draft = {
    kind: 'learning' as const,
    name: 'Git Essentials',
    authority: 'Udemy',
    issuedOn: '2021-07-08',
    credentialId: '',
    image: '/img/logos/udemy.png',
    link: '',
    proof: 'https://drive.google.com/file/d/x/view',
  };

  it('starts a new credential with the requested kind and the first known image', () => {
    expect(credentialDraftFrom(undefined, 'feedback')).toMatchObject({ kind: 'feedback', name: '', image: KNOWN_IMAGES[0] });
  });

  it('sends empty optional fields as null so an edit can clear them', () => {
    expect(toCredentialInput(draft)).toEqual({ ok: true, input: { ...draft, credentialId: null, link: null } });
  });

  it('round-trips an existing credential, showing nulls as empty inputs', () => {
    const dto = { ...draft, id: 4, credentialId: null, link: null };
    expect(credentialDraftFrom(dto, 'certification')).toEqual(draft);
  });

  it('reports the contract messages by field', () => {
    const result = toCredentialInput({ ...draft, name: '', link: 'not a url' });
    expect(result.ok ? null : result.errors).toMatchObject({ name: 'Enter a name', link: expect.any(String) });
  });
});

describe('profile drafts', () => {
  it('accepts the ported default', () => {
    expect(toProfileInput(DEFAULT_PROFILE)).toEqual({ ok: true, input: DEFAULT_PROFILE });
  });

  it('reports a summary without {years} on that field', () => {
    const result = toProfileInput({ ...DEFAULT_PROFILE, summaryMd: 'Ten years.' });
    expect(result.ok ? null : result.errors).toEqual({ summaryMd: 'Keep {years} where the experience should appear' });
  });
});
