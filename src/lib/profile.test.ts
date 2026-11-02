import { yearsShown } from './profile';

const now = new Date('2026-11-01T12:00:00Z');

describe('yearsShown', () => {
  it('phrases the experience the summary will show today', () => {
    expect(yearsShown('2020-02-24', now)).toBe('6 Years 9 Months');
  });

  it.each(['', '2020-02', 'not a date', '2027-01-01'])('returns null for %j (incomplete or in the future)', (start) => {
    expect(yearsShown(start, now)).toBeNull();
  });
});
