import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { mockApi } from '../../test/api';
import { postSummary } from '../../test/fixtures';
import { renderAt } from '../../test/render';
import AdminLayout from './AdminLayout';
import PostEditor from './PostEditor';

const draft = { ...postSummary({ id: 7, slug: 'draft-post', title: 'Draft post', status: 'draft', publishedAt: null }), bodyMd: 'Body' };

function renderAdmin(path: string) {
  return renderAt(
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<p>Admin home</p>} />
        <Route path="posts/:id" element={<PostEditor />} />
      </Route>
    </Routes>,
    path,
  );
}

/** Answers admin reads from `routes`, records writes, and replies to writes with `reply`. */
function adminApi(routes: Record<string, unknown>, reply: (method: string, body: unknown) => Response) {
  const writes: { method: string; url: string; body: unknown }[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (method === 'GET') return url in routes ? Response.json(routes[url]) : Response.json({}, { status: 404 });
    const body: unknown = init?.body ? JSON.parse(String(init.body)) : undefined;
    writes.push({ method, url, body });
    return reply(method, body);
  });
  return writes;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdminLayout', () => {
  it('offers GitHub sign-in when there is no session', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'Sign in required' }, { status: 401 }));
    renderAdmin('/admin');
    expect(await screen.findByRole('link', { name: 'Sign in with GitHub' })).toHaveAttribute('href', '/api/auth/login');
    expect(screen.queryByText('Admin home')).not.toBeInTheDocument();
  });

  it('shows the admin area and who is signed in', async () => {
    mockApi({ '/api/auth/me': { login: 'devsha256' } });
    renderAdmin('/admin');
    expect(await screen.findByText('Admin home')).toBeInTheDocument();
    expect(screen.getByText(/Signed in as devsha256/)).toBeInTheDocument();
  });
});

describe('PostEditor', () => {
  it('shows field errors from the shared contract without calling the API', async () => {
    const user = userEvent.setup();
    const writes = adminApi({ '/api/auth/me': { login: 'devsha256' } }, () => Response.json({}));
    renderAdmin('/admin/posts/new');
    await user.click(await screen.findByRole('button', { name: 'Save draft' }));
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Title')).toHaveAccessibleDescription('Enter a title');
    expect(writes).toHaveLength(0);
  });

  it('fills the slug from the title and creates the post', async () => {
    const user = userEvent.setup();
    const writes = adminApi({ '/api/auth/me': { login: 'devsha256' } }, (_m, body) =>
      Response.json({ ...draft, ...(typeof body === 'object' ? body : {}), id: 9 }, { status: 201 }),
    );
    renderAdmin('/admin/posts/new');
    await user.type(await screen.findByLabelText('Title'), 'Hello World');
    expect(screen.getByLabelText('Slug')).toHaveValue('hello-world');
    await user.type(screen.getByLabelText('Excerpt'), 'Short');
    await user.type(screen.getByLabelText('Body (Markdown)'), '# Hi');
    await user.click(screen.getByRole('button', { name: 'Save draft' }));
    await waitFor(() => expect(writes[0]).toMatchObject({ method: 'POST', url: '/api/admin/posts', body: { slug: 'hello-world' } }));
  });

  it('publishes a draft and says so', async () => {
    const user = userEvent.setup();
    const writes = adminApi({ '/api/auth/me': { login: 'devsha256' }, '/api/admin/posts/7': draft }, () =>
      Response.json({ ...draft, status: 'published', publishedAt: '2026-11-01T10:00:00.000Z' }),
    );
    renderAdmin('/admin/posts/7');
    await user.click(await screen.findByRole('button', { name: 'Publish' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Published');
    expect(writes[0]).toMatchObject({ method: 'PATCH', url: '/api/admin/posts/7', body: { status: 'published' } });
    expect(screen.getByRole('button', { name: 'Unpublish' })).toBeInTheDocument();
  });

  it('shows a server conflict next to the slug', async () => {
    const user = userEvent.setup();
    adminApi({ '/api/auth/me': { login: 'devsha256' }, '/api/admin/posts/7': draft }, () =>
      Response.json({ error: 'A post with this slug already exists' }, { status: 409 }),
    );
    renderAdmin('/admin/posts/7');
    await user.click(await screen.findByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('A post with this slug already exists');
  });
});
