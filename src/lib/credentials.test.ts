import { credential } from '../test/fixtures';
import { searchCredentials } from './credentials';

const item = (id: number, name: string, authority: string) => credential({ id, name, authority });

const list = [item(1, 'Python for Beginners', 'Udemy'), item(2, 'Git Essentials', 'Udemy'), item(3, 'MCP by Anthropic', 'LinkedIn Learning')];

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
