import type { Credential } from '../content/schema';
import { searchCredentials } from './credentials';

const item = (name: string, authority: string): Credential => ({
  id: crypto.randomUUID(),
  name,
  authority,
  date: '2024-01-01',
  image: '/img/logos/udemy.png',
  proof: 'https://drive.google.com/x',
});

const list = [item('Python for Beginners', 'Udemy'), item('Git Essentials', 'Udemy'), item('MCP by Anthropic', 'LinkedIn Learning')];

describe('searchCredentials', () => {
  it('matches name or issuer, ignoring case and extra spaces', () => {
    expect(searchCredentials(list, '  python ').map((c) => c.name)).toEqual(['Python for Beginners']);
    expect(searchCredentials(list, 'linkedin')).toHaveLength(1);
  });

  it('requires every word to match', () => {
    expect(searchCredentials(list, 'udemy git').map((c) => c.name)).toEqual(['Git Essentials']);
  });

  it('returns everything for an empty query', () => {
    expect(searchCredentials(list, '')).toBe(list);
  });
});
