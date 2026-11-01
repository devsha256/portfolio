import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { mockApi } from '../test/api';
import { postSummary } from '../test/fixtures';
import { renderAt } from '../test/render';
import Post from './Post';

// The Markdown renderer is a lazy chunk; on a cold transform cache it takes a few seconds to load.
const MARKDOWN_WAIT = { timeout: 15_000 };
const body = ['## Recursive mapping', '', 'Use `mapObject`.', '', '<script>alert("x")</script>', '', '| a | b |', '|---|---|', '| 1 | 2 |'].join('\n');

// Warm the lazy Markdown chunk once so a cold transform does not count against individual tests.
beforeAll(async () => {
  await import('../components/Markdown');
}, 60_000);

function renderPost(slug: string) {
  return renderAt(
    <Routes>
      <Route path="/blog/:slug" element={<Post />} />
    </Routes>,
    `/blog/${slug}`,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Post', () => {
  it('renders the title, date, reading time and Markdown body', async () => {
    mockApi({ '/api/posts/dataweave-deep-dive': { ...postSummary(), bodyMd: body } });
    renderPost('dataweave-deep-dive');
    expect(await screen.findByRole('heading', { level: 1, name: 'DataWeave Deep Dive' })).toBeInTheDocument();
    expect(screen.getByText(/15 Jun 2025/)).toBeInTheDocument();
    expect(screen.getByText(/1 min read/)).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: 'Recursive mapping' }, MARKDOWN_WAIT)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('never renders raw HTML from Markdown', async () => {
    mockApi({ '/api/posts/x': { ...postSummary({ slug: 'x' }), bodyMd: body } });
    const { container } = renderPost('x');
    await screen.findByRole('heading', { level: 2 }, MARKDOWN_WAIT);
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).not.toContain('alert');
  });

  it('shows a not-found message for a missing or unpublished post', async () => {
    mockApi({});
    renderPost('missing');
    expect(await screen.findByRole('heading', { level: 1, name: /this post is not here/i })).toBeInTheDocument();
  });
});
