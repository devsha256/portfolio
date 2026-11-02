import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { postSummary, project } from '../../test/fixtures';
import { renderAt } from '../../test/render';
import PostEditor from './PostEditor';
import PostsAdmin from './PostsAdmin';
import ProjectEditor from './ProjectEditor';
import ProjectsAdmin from './ProjectsAdmin';

function routes() {
  return (
    <Routes>
      <Route path="/admin" element={<PostsAdmin />} />
      <Route path="/admin/posts/:id" element={<PostEditor />} />
      <Route path="/admin/projects" element={<ProjectsAdmin />} />
      <Route path="/admin/projects/:id" element={<ProjectEditor />} />
    </Routes>
  );
}

/** Serves GETs from `reads`; records writes and answers them with `reply`. */
function api(reads: Record<string, unknown>, reply: Response = Response.json({})) {
  const writes: { method: string; url: string; body: unknown }[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (method === 'GET') return url in reads ? Response.json(reads[url]) : Response.json({}, { status: 404 });
    writes.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return reply.clone();
  });
  return writes;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('admin lists', () => {
  it('shows each post with its status', async () => {
    api({ '/api/admin/posts': { items: [postSummary(), postSummary({ id: 2, title: 'Idea', status: 'draft', publishedAt: null })] } });
    renderAt(routes(), '/admin');
    expect(await screen.findByRole('link', { name: 'Idea' })).toHaveAttribute('href', '/admin/posts/2');
    expect(screen.getByRole('cell', { name: 'Draft' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Published' })).toBeInTheDocument();
  });

  it('invites the first post when there are none', async () => {
    api({ '/api/admin/posts': { items: [] } });
    renderAt(routes(), '/admin');
    expect(await screen.findByText(/No posts yet/)).toBeInTheDocument();
  });

  it('lists projects with their period', async () => {
    api({ '/api/admin/projects': { items: [project()] } });
    renderAt(routes(), '/admin/projects');
    expect(await screen.findByRole('link', { name: 'Boomi to MuleSoft migration' })).toHaveAttribute('href', '/admin/projects/1');
    expect(screen.getByText('Jul 2025 – Present')).toBeInTheDocument();
  });
});

describe('ProjectEditor', () => {
  it('creates an ongoing project from month inputs', async () => {
    const user = userEvent.setup();
    const writes = api({}, Response.json(project({ id: 5 }), { status: 201 }));
    renderAt(routes(), '/admin/projects/new');
    await user.type(screen.getByLabelText('Title'), 'Migration');
    await user.type(screen.getByLabelText('Company'), 'Accenture');
    await user.type(screen.getByLabelText('Start month'), '2025-07');
    await user.type(screen.getByLabelText('Skills'), 'DataWeave, MUnit');
    await user.type(screen.getByLabelText('Description'), 'Moved nine modules.');
    await user.click(screen.getByRole('button', { name: 'Create project' }));
    await waitFor(() =>
      expect(writes[0]).toMatchObject({
        method: 'POST',
        body: { startMonth: '2025-07-01', endMonth: null, skills: ['DataWeave', 'MUnit'] },
      }),
    );
  });

  it('shows a load notice for a project that does not exist', async () => {
    api({});
    renderAt(routes(), '/admin/projects/99');
    expect(await screen.findByText(/does not exist/)).toBeInTheDocument();
  });
});

describe('deleting', () => {
  it('deletes a post after confirmation and returns to the list', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('confirm', () => true);
    const post = { ...postSummary({ id: 3 }), bodyMd: 'b' };
    const writes = api({ '/api/admin/posts/3': post, '/api/admin/posts': { items: [] } }, new Response(null, { status: 204 }));
    renderAt(routes(), '/admin/posts/3');
    await user.click(await screen.findByRole('button', { name: 'Delete post' }));
    expect(writes[0]).toMatchObject({ method: 'DELETE', url: '/api/admin/posts/3' });
    expect(await screen.findByRole('heading', { name: 'Posts' })).toBeInTheDocument();
  });

  it('does nothing when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('confirm', () => false);
    const writes = api({ '/api/admin/projects/1': project() });
    renderAt(routes(), '/admin/projects/1');
    await user.click(await screen.findByRole('button', { name: 'Delete project' }));
    expect(writes).toHaveLength(0);
  });
});
