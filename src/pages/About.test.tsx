import { screen, within } from '@testing-library/react';
import { mockApi } from '../test/api';
import { project } from '../test/fixtures';
import { renderAt } from '../test/render';
import About from './About';

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

  it('shows the certifications from the bundled credentials', () => {
    mockApi({ '/api/projects': { items: [] } });
    renderAt(<About />);
    expect(screen.getByText('MuleSoft Certified Platform Architect - Level 1')).toBeInTheDocument();
  });
});
