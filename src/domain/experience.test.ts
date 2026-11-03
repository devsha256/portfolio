import { experienceSince } from './experience.js';

const start = '2020-02-24';

describe('experienceSince', () => {
  it.each([
    ['2026-11-01', '6 Years 9 Months'],
    ['2021-02-01', '1 Year'],
    ['2021-03-01', '1 Year 1 Month'],
    ['2020-02-28', '0 Years'],
    ['2023-01-15', '2 Years 11 Months'],
  ])('on %s reads %s', (now, expected) => {
    expect(experienceSince(start, new Date(`${now}T12:00:00Z`))).toBe(expected);
  });
});
