import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('App shell', () => {
  it('offers a skip link to the main landmark', async () => {
    renderAt('/nowhere');
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main');
    expect(await screen.findByRole('main')).toHaveAttribute('id', 'main');
  });

  it('lists every public page in the header and marks the current one', () => {
    renderAt('/nowhere');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    const labels = within(nav).getAllByRole('link').map((link) => link.textContent);
    expect(labels).toEqual(['Projects', 'Blog', 'Credentials', 'About', 'Contact']);
  });

  it('shows a not-found page for an unknown path', async () => {
    renderAt('/nowhere');
    expect(await screen.findByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument();
    expect(document.title).toMatch(/not found/i);
  });
});
