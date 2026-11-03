import { CredentialDto, CredentialInput, CredentialPatch, PostInput, PostListQuery, ProjectInput, SiteProfile } from './contracts.js';
import { DEFAULT_PROFILE } from './site.js';

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

describe('CredentialInput', () => {
  const credential = {
    kind: 'certification',
    name: 'MuleSoft Certified Developer - Level 2',
    authority: 'MuleSoft',
    issuedOn: '2022-07-31',
    image: '/img/certifications/mcd-l2.png',
    proof: 'https://drive.google.com/file/d/x/view',
  };

  it('accepts a credential without the optional ID and verify link', () => {
    expect(CredentialInput.parse(credential)).toEqual(credential);
  });

  it.each(['award', '', 'Certification'])('rejects kind %j', (kind) => {
    expect(CredentialInput.safeParse({ ...credential, kind }).success).toBe(false);
  });

  it.each(['/public/img/x.png', 'https://evil.dev/img/x.png', 'img/x.png'])('rejects image %j outside /img', (image) => {
    const result = CredentialInput.safeParse({ ...credential, image });
    expect(result.success ? null : result.error.issues[0]?.message).toBe('Pick an image under /img');
  });

  it('names the empty fields in plain words', () => {
    const result = CredentialInput.safeParse({ ...credential, name: ' ', authority: '' });
    expect(result.success ? [] : result.error.issues.map((issue) => issue.message)).toEqual(['Enter a name', 'Enter the issuer']);
  });
});

describe('CredentialPatch', () => {
  it('is partial and adds nothing the caller did not send', () => {
    expect(CredentialPatch.parse({ name: 'Renamed' })).toEqual({ name: 'Renamed' });
  });

  it('can clear the optional verify link', () => {
    expect(CredentialPatch.parse({ link: null })).toEqual({ link: null });
  });
});

describe('CredentialDto', () => {
  it('carries the id and null optionals from the database', () => {
    const row = { id: 3, kind: 'feedback', name: 'Award', authority: 'TCS', issuedOn: '2025-02-24', credentialId: null, image: '/img/logos/tcs.png', link: null, proof: 'https://drive.google.com/x' };
    expect(CredentialDto.parse(row)).toEqual(row);
  });
});

describe('SiteProfile', () => {
  it('accepts the ported default profile', () => {
    expect(SiteProfile.parse(DEFAULT_PROFILE)).toEqual(DEFAULT_PROFILE);
  });

  it('requires {years} in the summary', () => {
    const result = SiteProfile.safeParse({ ...DEFAULT_PROFILE, summaryMd: 'Ten years of integration work.' });
    expect(result.success ? null : result.error.issues[0]).toMatchObject({
      path: ['summaryMd'],
      message: 'Keep {years} where the experience should appear',
    });
  });

  it('rejects a career start that is not a date', () => {
    expect(SiteProfile.safeParse({ ...DEFAULT_PROFILE, careerStart: '2020-02' }).success).toBe(false);
  });

  it('allows an empty About introduction', () => {
    expect(SiteProfile.parse({ ...DEFAULT_PROFILE, aboutMd: '' }).aboutMd).toBe('');
  });
});
