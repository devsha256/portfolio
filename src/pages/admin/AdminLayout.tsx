import { z } from 'zod';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { signOut } from '../../lib/admin-client';

const Me = z.object({ login: z.string() });

function SignIn() {
  return (
    <section className="py-16">
      <h1 className="text-4xl font-bold tracking-tight">Admin</h1>
      <p className="mt-4 max-w-prose text-muted">Only the site owner can sign in. You will return here after GitHub confirms who you are.</p>
      <a href="/api/auth/login" className="button button--primary mt-8">
        Sign in with GitHub
      </a>
    </section>
  );
}

function AdminBar({ login }: { login: string }) {
  const navigate = useNavigate();
  return (
    <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line pt-8 pb-4">
      <nav aria-label="Admin" className="flex gap-5 font-medium">
        <NavLink to="/admin" end className="nav-link">
          Posts
        </NavLink>
        <NavLink to="/admin/projects" className="nav-link">
          Projects
        </NavLink>
      </nav>
      <p className="ml-auto text-sm text-muted">Signed in as {login}</p>
      <button type="button" className="text-sm underline" onClick={() => void signOut().then(() => navigate('/'))}>
        Sign out
      </button>
    </div>
  );
}

/** UX gate only: the server checks the session on every admin request regardless. */
export function AdminLayout() {
  const me = useApi('/api/auth/me', Me);
  return (
    <>
      <meta name="robots" content="noindex" />
      <title>Admin | Saddam Hossain</title>
      {me.status === 'loading' && <p className="py-16 text-muted">Checking sign-in…</p>}
      {(me.status === 'unauthorized' || me.status === 'not-found') && <SignIn />}
      {me.status === 'error' && <p className="py-16">Sign-in could not be checked. Refresh to try again.</p>}
      {me.status === 'ready' && (
        <>
          <AdminBar login={me.data.login} />
          <Outlet />
        </>
      )}
    </>
  );
}

export default AdminLayout;
