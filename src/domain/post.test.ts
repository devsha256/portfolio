import { applyStatus, readingMinutes } from './post';

const now = new Date('2026-11-01T10:00:00Z');
const earlier = new Date('2025-06-15T03:30:00Z');

describe('applyStatus', () => {
  it('publishing a never-published draft stamps publishedAt with now', () => {
    expect(applyStatus({ status: 'draft', publishedAt: null }, 'published', now)).toEqual({
      status: 'published',
      publishedAt: now,
    });
  });

  it('republishing keeps the original publishedAt', () => {
    expect(applyStatus({ status: 'draft', publishedAt: earlier }, 'published', now).publishedAt).toBe(earlier);
  });

  it('unpublishing keeps the date so a later republish keeps it too', () => {
    expect(applyStatus({ status: 'published', publishedAt: earlier }, 'draft', now)).toEqual({
      status: 'draft',
      publishedAt: earlier,
    });
  });
});

describe('readingMinutes', () => {
  it('rounds up at 220 words per minute', () => {
    expect(readingMinutes(Array(221).fill('word').join(' '))).toBe(2);
  });

  it('is at least one minute', () => {
    expect(readingMinutes('')).toBe(1);
  });
});
