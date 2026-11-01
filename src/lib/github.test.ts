import { RepoList } from './github';

const repo = (name: string, overrides: Record<string, unknown> = {}) => ({
  name,
  html_url: `https://github.com/devsha256/${name}`,
  description: null,
  language: 'DataWeave',
  stargazers_count: 0,
  fork: false,
  updated_at: '2025-01-01T00:00:00Z',
  extra_field: 'ignored',
  ...overrides,
});

describe('RepoList', () => {
  it('drops forks and sorts by most recently updated', () => {
    const repos = RepoList.parse([
      repo('old'),
      repo('forked', { fork: true }),
      repo('new', { updated_at: '2026-01-01T00:00:00Z' }),
    ]);
    expect(repos.map((r) => r.name)).toEqual(['new', 'old']);
  });

  it('re-parses its own output unchanged (safe to cache)', () => {
    const once = RepoList.parse([repo('a')]);
    expect(RepoList.parse(JSON.parse(JSON.stringify(once)))).toEqual(once);
  });
});
