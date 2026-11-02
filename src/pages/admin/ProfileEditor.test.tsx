import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_PROFILE } from '../../domain/site';
import { stubApi } from '../../test/api';
import { freezeDate } from '../../test/clock';
import { renderAt } from '../../test/render';
import ProfileEditor from './ProfileEditor';

const echo = (body: unknown) => Response.json(body);
const SAVED = { ...DEFAULT_PROFILE, tagline: 'APIs that outlive their authors', summaryMd: 'Over {years} of integration work.\n\nSecond paragraph.' };
const READS = { '/api/admin/content/profile': SAVED };

freezeDate('2026-11-01T12:00:00Z');
afterEach(() => {
  vi.restoreAllMocks();
});

describe('ProfileEditor', () => {
  it('loads the saved profile and saves changes with a status', async () => {
    const user = userEvent.setup();
    const writes = stubApi(READS, echo);
    renderAt(<ProfileEditor />);
    const tagline = await screen.findByLabelText('Tagline');
    expect(tagline).toHaveValue('APIs that outlive their authors');
    await user.clear(tagline);
    await user.type(tagline, 'Integration architect');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Saved');
    expect(writes).toEqual([
      { method: 'PUT', url: '/api/admin/content/profile', body: { ...SAVED, tagline: 'Integration architect' } },
    ]);
  });

  it('flags a summary without {years} and sends nothing', async () => {
    const user = userEvent.setup();
    const writes = stubApi(READS, echo);
    renderAt(<ProfileEditor />);
    const summary = await screen.findByLabelText('Summary');
    await user.clear(summary);
    await user.type(summary, 'Ten years of work.');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(summary).toHaveAttribute('aria-invalid', 'true');
    expect(summary).toHaveAccessibleDescription('Keep {years} where the experience should appear');
    expect(writes).toHaveLength(0);
  });

  it('shows the years the summary will print, updating with the career start', async () => {
    const user = userEvent.setup();
    stubApi(READS, echo);
    renderAt(<ProfileEditor />);
    expect(await screen.findByText('Years shown today: 6 Years 9 Months')).toBeInTheDocument();
    const start = screen.getByLabelText('Career start');
    await user.clear(start);
    await user.type(start, '2016-11-01');
    expect(screen.getByText('Years shown today: 10 Years')).toBeInTheDocument();
  });

  it('previews the summary exactly as the public pages print it', async () => {
    const user = userEvent.setup();
    stubApi(READS, echo);
    renderAt(<ProfileEditor />);
    await user.click(await screen.findByRole('button', { name: 'Preview summary' }));
    expect(screen.getByText('Over 6 Years 9 Months of integration work.')).toBeInTheDocument();
    expect(screen.getByText('Second paragraph.')).toBeInTheDocument();
  });

  it('shows the server message when saving fails', async () => {
    const user = userEvent.setup();
    stubApi(READS, () => Response.json({ error: 'Sign in required' }, { status: 401 }));
    renderAt(<ProfileEditor />);
    await user.click(await screen.findByRole('button', { name: 'Save profile' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sign in required');
  });
});
