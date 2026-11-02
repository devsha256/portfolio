import { screen } from '@testing-library/react';
import { DEFAULT_PROFILE } from '../domain/site';
import { mockApi } from '../test/api';
import { freezeDate } from '../test/clock';
import { page, postSummary } from '../test/fixtures';
import { renderAt } from '../test/render';
import Home from './Home';

freezeDate('2026-11-01T12:00:00Z');
afterEach(() => {
  vi.restoreAllMocks();
});

describe('Home', () => {
  it('shows the ported profile while the saved one loads, with the computed experience', () => {
    mockApi({ '/api/posts': page([postSummary()]) });
    renderAt(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Saddam Hossain' })).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_PROFILE.tagline)).toBeInTheDocument();
    expect(screen.getByText(/With over 6 Years 9 Months of experience/)).toBeInTheDocument();
    expect(screen.queryByText(/\{years\}/)).not.toBeInTheDocument();
  });

  it('replaces the fallback with the profile saved in the admin', async () => {
    mockApi({
      '/api/posts': page([]),
      '/api/content/profile': { ...DEFAULT_PROFILE, tagline: 'APIs that outlive their authors', summaryMd: 'Edited, {years} in.' },
    });
    renderAt(<Home />);
    expect(await screen.findByText('APIs that outlive their authors')).toBeInTheDocument();
    expect(screen.getByText('Edited, 6 Years 9 Months in.')).toBeInTheDocument();
    expect(screen.queryByText(DEFAULT_PROFILE.tagline)).not.toBeInTheDocument();
  });

  it('links to the main sections', () => {
    mockApi({ '/api/posts': page([]) });
    renderAt(<Home />);
    expect(screen.getByRole('link', { name: 'See projects' })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: 'Read the blog' })).toHaveAttribute('href', '/blog');
  });

  it('lists recent posts', async () => {
    mockApi({ '/api/posts': page([postSummary()]) });
    renderAt(<Home />);
    expect(await screen.findByRole('link', { name: 'DataWeave Deep Dive' })).toHaveAttribute('href', '/blog/dataweave-deep-dive');
  });
});
