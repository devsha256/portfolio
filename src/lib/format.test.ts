import { formatDate } from './format';

it.each([
  ['2025-06-15T03:30:00.000Z', '15 Jun 2025'],
  ['2023-12-14', '14 Dec 2023'],
])('formatDate(%s) → %s', (iso, text) => {
  expect(formatDate(iso)).toBe(text);
});
