import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { credential, learningHistory } from '../../test/fixtures';
import { renderAt } from '../../test/render';
import CredentialEditor from './CredentialEditor';
import CredentialsAdmin from './CredentialsAdmin';

const ALL = [
  credential(),
  credential({ id: 2, kind: 'feedback', name: 'Service & Commitment Award (5 years)', authority: 'TCS', image: '/img/logos/tcs.png' }),
  ...learningHistory(3),
];

function routes() {
  return (
    <Routes>
      <Route path="/admin/credentials" element={<CredentialsAdmin />} />
      <Route path="/admin/credentials/:id" element={<CredentialEditor />} />
    </Routes>
  );
}

/** Serves GETs from `reads`; records writes and answers them with `reply`. */
function api(reads: Record<string, unknown>, reply: () => Response = () => Response.json({})) {
  const writes: { method: string; url: string; body: unknown }[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (method === 'GET') return url in reads ? Response.json(reads[url]) : Response.json({}, { status: 404 });
    writes.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    return reply();
  });
  return writes;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('CredentialsAdmin', () => {
  it('shows a tab per kind with its count and lists that kind with edit links', async () => {
    api({ '/api/admin/content/credentials': { items: ALL } });
    renderAt(routes(), '/admin/credentials');
    expect(await screen.findByRole('tab', { name: 'Certifications (1)' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Feedback (1)' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Learning history (3)' })).toBeInTheDocument();
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByRole('link', { name: 'Edit MuleSoft Certified Developer - Level 2' })).toHaveAttribute(
      'href',
      '/admin/credentials/1',
    );
    expect(within(panel).queryByText('Course 1')).not.toBeInTheDocument();
  });

  it('searches within the selected tab', async () => {
    const user = userEvent.setup();
    api({ '/api/admin/content/credentials': { items: ALL } });
    renderAt(routes(), '/admin/credentials?tab=learning');
    await user.type(await screen.findByRole('searchbox', { name: 'Search learning history' }), 'course 2');
    expect(screen.getByText('Showing 1 of 1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit Course 2' })).toBeInTheDocument();
  });

  it('starts a new credential of the selected kind', async () => {
    api({ '/api/admin/content/credentials': { items: ALL } });
    renderAt(routes(), '/admin/credentials?tab=feedback');
    expect(await screen.findByRole('link', { name: 'New credential' })).toHaveAttribute('href', '/admin/credentials/new?kind=feedback');
  });
});

describe('CredentialEditor', () => {
  it('preselects the kind from the link and shows contract errors without sending anything', async () => {
    const user = userEvent.setup();
    const writes = api({});
    renderAt(routes(), '/admin/credentials/new?kind=learning');
    expect(await screen.findByRole('radio', { name: 'Learning history' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Create credential' }));
    expect(screen.getByLabelText('Name')).toHaveAccessibleDescription('Enter a name');
    expect(screen.getByLabelText('Issuer')).toHaveAttribute('aria-invalid', 'true');
    expect(writes).toHaveLength(0);
  });

  it('previews the image picked from the list', async () => {
    const user = userEvent.setup();
    api({});
    renderAt(routes(), '/admin/credentials/new?kind=certification');
    await user.selectOptions(await screen.findByLabelText('Image'), '/img/logos/udemy.png');
    expect(screen.getByRole('img', { name: 'Selected logo' })).toHaveAttribute('src', '/img/logos/udemy.png');
  });

  it('creates a credential and sends empty optional fields as null', async () => {
    const user = userEvent.setup();
    const writes = api({}, () => Response.json(credential({ id: 9 }), { status: 201 }));
    renderAt(routes(), '/admin/credentials/new?kind=certification');
    await user.type(await screen.findByLabelText('Name'), 'MCD Level 1');
    await user.type(screen.getByLabelText('Issuer'), 'MuleSoft');
    await user.type(screen.getByLabelText('Issued on'), '2020-12-05');
    await user.type(screen.getByLabelText('Certificate link'), 'https://drive.google.com/file/d/n/view');
    await user.click(screen.getByRole('button', { name: 'Create credential' }));
    await waitFor(() =>
      expect(writes[0]).toMatchObject({
        method: 'POST',
        url: '/api/admin/content/credentials',
        body: { kind: 'certification', name: 'MCD Level 1', credentialId: null, link: null },
      }),
    );
  });

  it('shows a duplicate certificate as an alert', async () => {
    const user = userEvent.setup();
    api({ '/api/admin/credentials/1': credential() }, () =>
      Response.json({ error: 'This certificate is already listed' }, { status: 409 }),
    );
    renderAt(routes(), '/admin/credentials/1');
    await user.click(await screen.findByRole('button', { name: 'Save changes' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This certificate is already listed');
  });

  it('deletes after confirmation and returns to the list', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('confirm', () => true);
    const writes = api(
      { '/api/admin/credentials/1': credential(), '/api/admin/content/credentials': { items: [] } },
      () => new Response(null, { status: 204 }),
    );
    renderAt(routes(), '/admin/credentials/1');
    await user.click(await screen.findByRole('button', { name: 'Delete credential' }));
    expect(writes[0]).toMatchObject({ method: 'DELETE', url: '/api/admin/credentials/1' });
    expect(await screen.findByRole('heading', { name: 'Credentials' })).toBeInTheDocument();
  });

  it('keeps the credential when the confirmation is cancelled', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('confirm', () => false);
    const writes = api({ '/api/admin/credentials/1': credential() });
    renderAt(routes(), '/admin/credentials/1');
    await user.click(await screen.findByRole('button', { name: 'Delete credential' }));
    expect(writes).toHaveLength(0);
  });
});
