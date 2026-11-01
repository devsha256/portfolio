import { screen } from '@testing-library/react';
import { mockApi } from '../test/api';
import { page, postSummary } from '../test/fixtures';
import { renderAt } from '../test/render';
import Home from './Home';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));
  mockApi({ '/api/posts': page([postSummary()]) });
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Home', () => {
  it('introduces the owner with the computed experience', () => {
    renderAt(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: 'Saddam Hossain' })).toBeInTheDocument();
    expect(screen.getByText(/With over 6 Years 9 Months of experience/)).toBeInTheDocument();
    expect(screen.queryByText(/\{years\}/)).not.toBeInTheDocument();
  });

  it('links to the main sections', () => {
    renderAt(<Home />);
    expect(screen.getByRole('link', { name: 'See projects' })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: 'Read the blog' })).toHaveAttribute('href', '/blog');
  });

  it('lists recent posts', async () => {
    renderAt(<Home />);
    expect(await screen.findByRole('link', { name: 'DataWeave Deep Dive' })).toHaveAttribute(
      'href',
      '/blog/dataweave-deep-dive',
    );
  });
});
