import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi } from '../test/api';
import { credential, learningHistory } from '../test/fixtures';
import { renderAt } from '../test/render';
import Credentials from './Credentials';

const LEARNING = learningHistory(45);

beforeEach(() => {
  mockApi({
    '/api/content/credentials?kind=certification': { items: [credential()] },
    '/api/content/credentials?kind=feedback': {
      items: [credential({ id: 2, kind: 'feedback', name: 'Service & Commitment Award (5 years)', authority: 'TCS' })],
    },
    '/api/content/credentials?kind=learning': { items: LEARNING },
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('Credentials', () => {
  it('opens on certifications and lists what the API returns', async () => {
    renderAt(<Credentials />, '/credentials');
    expect(screen.getByRole('tab', { name: 'Certifications' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('MuleSoft Certified Developer - Level 2')).toBeInTheDocument();
  });

  it('moves between tabs with the arrow keys and loads that kind', async () => {
    const user = userEvent.setup();
    renderAt(<Credentials />, '/credentials');
    await user.click(screen.getByRole('tab', { name: 'Certifications' }));
    await user.keyboard('{ArrowRight}');
    const feedback = screen.getByRole('tab', { name: 'Feedback' });
    expect(feedback).toHaveAttribute('aria-selected', 'true');
    expect(feedback).toHaveFocus();
    expect(await screen.findByText('Service & Commitment Award (5 years)')).toBeInTheDocument();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Learning history' })).toHaveFocus();
  });

  it('searches learning history and shows how many match', async () => {
    const user = userEvent.setup();
    renderAt(<Credentials />, '/credentials?tab=learning');
    expect(await screen.findByText('Showing 20 of 45')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Search learning history' }), 'course 42');
    expect(screen.getByText('Showing 1 of 1')).toBeInTheDocument();
  });

  it('shows more entries on request', async () => {
    const user = userEvent.setup();
    renderAt(<Credentials />, '/credentials?tab=learning');
    await user.click(await screen.findByRole('button', { name: 'Show 20 more' }));
    expect(screen.getByText('Showing 40 of 45')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show 5 more' })).toBeInTheDocument();
  });

  it('says so when a list cannot be loaded', async () => {
    vi.restoreAllMocks();
    mockApi({});
    renderAt(<Credentials />, '/credentials');
    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
  });
});
