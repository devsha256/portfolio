import { screen, within } from '@testing-library/react';
import { DEFAULT_PROFILE } from '../domain/site';
import { mockApi } from '../test/api';
import { credential, project } from '../test/fixtures';
import { renderAt } from '../test/render';
import About from './About';

// The About intro renders through the lazy Markdown chunk; warm it so a cold transform does not time out a test.
beforeAll(async () => {
  await import('../components/Markdown');
}, 60_000);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('About', () => {
  it('lists skills gathered from projects, most used first, linking to the project filter', async () => {
    mockApi({
      '/api/projects': {
        items: [project(), project({ id: 2, startMonth: '2024-01-01', skills: ['DataWeave', 'Maven'] })],
      },
    });
    renderAt(<About />);
    const skills = await screen.findByRole('list', { name: 'Skills' });
    const links = within(skills).getAllByRole('link');
    expect(links[0]).toHaveTextContent('DataWeave');
    expect(links[0]).toHaveAttribute('href', '/projects?skill=dataweave');
    expect(links).toHaveLength(3);
  });

  it('shows the certifications served by the API', async () => {
    mockApi({
      '/api/projects': { items: [] },
      '/api/content/credentials?kind=certification': { items: [credential({ name: 'MuleSoft Certified Platform Architect - Level 1' })] },
    });
    renderAt(<About />);
    expect(await screen.findByText('MuleSoft Certified Platform Architect - Level 1')).toBeInTheDocument();
  });

  it('renders the About introduction from the saved profile as Markdown', async () => {
    mockApi({
      '/api/projects': { items: [] },
      '/api/content/profile': { ...DEFAULT_PROFILE, aboutMd: 'Based in **Kolkata**.' },
    });
    renderAt(<About />);
    const strong = await screen.findByText('Kolkata', {}, { timeout: 15_000 });
    expect(strong.tagName).toBe('STRONG');
  });
});
