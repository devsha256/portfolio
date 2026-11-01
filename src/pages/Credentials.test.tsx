import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderAt } from '../test/render';
import Credentials from './Credentials';

describe('Credentials', () => {
  it('opens on certifications', () => {
    renderAt(<Credentials />, '/credentials');
    expect(screen.getByRole('tab', { name: 'Certifications' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('MuleSoft Certified Developer - Level 2');
  });

  it('moves between tabs with the arrow keys', async () => {
    const user = userEvent.setup();
    renderAt(<Credentials />, '/credentials');
    await user.click(screen.getByRole('tab', { name: 'Certifications' }));
    await user.keyboard('{ArrowRight}');
    const feedback = screen.getByRole('tab', { name: 'Feedback' });
    expect(feedback).toHaveAttribute('aria-selected', 'true');
    expect(feedback).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Service & Commitment Award (5 years)');
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Learning history' })).toHaveFocus();
  });

  it('opens the tab named in the URL', () => {
    renderAt(<Credentials />, '/credentials?tab=learning');
    expect(screen.getByRole('tab', { name: 'Learning history' })).toHaveAttribute('aria-selected', 'true');
  });

  it('searches learning history and shows how many match', async () => {
    const user = userEvent.setup();
    renderAt(<Credentials />, '/credentials?tab=learning');
    expect(screen.getByText('Showing 20 of 309')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox', { name: 'Search learning history' }), 'git essentials');
    expect(screen.getByText('Showing 1 of 1')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Git Essentials: Learn Git with Bitbucket and Sourcetree');
  });

  it('shows more entries on request', async () => {
    const user = userEvent.setup();
    renderAt(<Credentials />, '/credentials?tab=learning');
    await user.click(screen.getByRole('button', { name: 'Show 20 more' }));
    expect(screen.getByText('Showing 40 of 309')).toBeInTheDocument();
  });
});
