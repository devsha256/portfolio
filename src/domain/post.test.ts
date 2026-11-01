import { readingMinutes } from './post';

describe('readingMinutes', () => {
  it('rounds up at 220 words per minute', () => {
    expect(readingMinutes(Array(221).fill('word').join(' '))).toBe(2);
  });

  it('is at least one minute', () => {
    expect(readingMinutes('')).toBe(1);
  });
});
