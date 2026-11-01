import { Suspense } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { PUBLIC_PAGES, SITE } from '../domain/site';
import { SOCIAL_LINKS } from '../lib/social';
import { ThemeToggle } from './ThemeToggle';

const NAV_PAGES = PUBLIC_PAGES.filter((page) => page.path !== '/');

function Header() {
  return (
    <header className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-8 gap-y-3 px-5 pt-6 pb-4">
      <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight no-underline">
        <svg aria-hidden="true" viewBox="0 0 28 12" width="28" height="12">
          <circle cx="4" cy="6" r="3.5" fill="var(--signal)" />
          <path d="M8 6h12" stroke="var(--signal)" strokeWidth="2" />
          <circle cx="24" cy="6" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
        {SITE.name}
      </Link>
      <nav aria-label="Main" className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[0.95rem]">
          {NAV_PAGES.map((page) => (
            <li key={page.path}>
              <NavLink to={page.path} className="nav-link no-underline hover:underline">
                {page.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="ml-auto sm:ml-0">
        <ThemeToggle />
      </div>
    </header>
  );
}

function Footer() {
  const links = [{ href: `mailto:${SITE.email}`, label: 'Email' }, ...SOCIAL_LINKS, { href: '/rss.xml', label: 'RSS' }];
  return (
    <footer className="mx-auto mt-24 max-w-5xl border-t border-line px-5 py-8 text-sm text-muted">
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <a href={link.href}>{link.label}</a>
          </li>
        ))}
      </ul>
    </footer>
  );
}

export function Layout() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto max-w-5xl px-5 outline-none">
        <Suspense fallback={<p className="py-16 text-muted">Loading…</p>}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
