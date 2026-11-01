import { screen } from '@testing-library/react';
import { renderAt } from '../test/render';
import Contact from './Contact';

describe('Contact', () => {
  it.each([
    ['Email dev.hsaddam@gmail.com', 'mailto:dev.hsaddam@gmail.com'],
    ['LinkedIn', 'https://www.linkedin.com/in/hsaddam'],
    ['GitHub', 'https://github.com/devsha256'],
    ['YouTube', 'https://www.youtube.com/@tea-verse'],
  ])('links to %s', (name, href) => {
    renderAt(<Contact />);
    expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
  });
});
