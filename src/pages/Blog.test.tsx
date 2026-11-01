import { screen } from '@testing-library/react';
import { mockApi } from '../test/api';
import { page, postSummary } from '../test/fixtures';
import { renderAt } from '../test/render';
import Blog from './Blog';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Blog', () => {
  it('lists published posts with links and tags', async () => {
    mockApi({ '/api/posts': page([postSummary()]) });
    renderAt(<Blog />, '/blog');
    expect(await screen.findByRole('link', { name: 'DataWeave Deep Dive' })).toHaveAttribute('href', '/blog/dataweave-deep-dive');
    expect(screen.getByRole('link', { name: '#dataweave' })).toHaveAttribute('href', '/blog?tag=dataweave');
  });

  it('asks the API for the tag and page in the URL', async () => {
    const spy = mockApi({ '/api/posts': page([postSummary()]) });
    renderAt(<Blog />, '/blog?tag=dataweave&page=2');
    await screen.findByText(/Posts tagged/);
    expect(String(spy.mock.calls[0]?.[0])).toBe('/api/posts?page=2&limit=10&tag=dataweave');
    expect(screen.getByRole('link', { name: 'Show all posts' })).toHaveAttribute('href', '/blog');
  });

  it('offers older posts when there are more pages', async () => {
    mockApi({ '/api/posts': { items: [postSummary()], page: 1, limit: 10, total: 11 } });
    renderAt(<Blog />, '/blog');
    expect(await screen.findByRole('link', { name: 'Older posts' })).toHaveAttribute('href', '/blog?page=2');
    expect(screen.queryByRole('link', { name: 'Newer posts' })).not.toBeInTheDocument();
  });

  it('explains an empty list', async () => {
    mockApi({ '/api/posts': page([]) });
    renderAt(<Blog />, '/blog');
    expect(await screen.findByText(/No posts yet/)).toBeInTheDocument();
  });
});
