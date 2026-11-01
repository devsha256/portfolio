import { screen } from '@testing-library/react';
import { mockApi } from '../test/api';
import { project } from '../test/fixtures';
import { renderAt } from '../test/render';
import Projects from './Projects';

const projects = [
  project(),
  project({ id: 2, company: 'Tata Consultancy Services', title: 'CloudHub VPC migration', startMonth: '2024-01-01', endMonth: '2024-06-01', skills: ['Maven', 'Postman'] }),
];
const github = [
  { name: 'dw-utils', html_url: 'https://github.com/devsha256/dw-utils', description: 'DataWeave helpers', language: 'DataWeave', stargazers_count: 3, fork: false, updated_at: '2025-01-01T00:00:00Z' },
  { name: 'someone-elses', html_url: 'https://github.com/devsha256/x', description: null, language: null, stargazers_count: 0, fork: true, updated_at: '2025-01-01T00:00:00Z' },
];

beforeEach(() => {
  sessionStorage.clear();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('Projects', () => {
  it('shows the timeline newest first with readable periods', async () => {
    mockApi({ '/api/projects': { items: projects }, 'https://api.github.com': github });
    renderAt(<Projects />);
    const timeline = await screen.findByRole('list', { name: 'Project timeline' });
    const items = [...timeline.children];
    expect(items[0]).toHaveTextContent('Jul 2025 – Present');
    expect(items[1]).toHaveTextContent('Jan 2024 – Jun 2024');
  });

  it('filters by the skill in the URL and offers a way back', async () => {
    mockApi({ '/api/projects': { items: projects }, 'https://api.github.com': github });
    renderAt(<Projects />, '/projects?skill=maven');
    const timeline = await screen.findByRole('list', { name: 'Project timeline' });
    expect(timeline.children).toHaveLength(1);
    expect(timeline).toHaveTextContent('CloudHub VPC migration');
    expect(screen.getByRole('link', { name: 'Show all projects' })).toHaveAttribute('href', '/projects');
  });

  it('lists own repositories but not forks', async () => {
    mockApi({ '/api/projects': { items: projects }, 'https://api.github.com': github });
    renderAt(<Projects />);
    expect(await screen.findByRole('link', { name: 'dw-utils' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'someone-elses' })).not.toBeInTheDocument();
  });

  it('falls back to a GitHub profile link when GitHub cannot be reached', async () => {
    mockApi({ '/api/projects': { items: projects } });
    renderAt(<Projects />);
    expect(await screen.findByRole('link', { name: /all repositories on GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/devsha256',
    );
  });
});
