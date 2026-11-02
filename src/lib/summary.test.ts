import { DEFAULT_PROFILE } from '../domain/site';
import { summaryParagraphs } from './summary';

const now = new Date('2026-11-01T12:00:00Z');

describe('summaryParagraphs', () => {
  it('splits on blank lines and fills every {years} from the career start', () => {
    const profile = { ...DEFAULT_PROFILE, careerStart: '2021-11-01', summaryMd: 'First {years}.\n\n  \nSecond, still {years}.' };
    expect(summaryParagraphs(profile, now)).toEqual(['First 5 Years.', 'Second, still 5 Years.']);
  });

  it('keeps single line breaks inside a paragraph', () => {
    const profile = { ...DEFAULT_PROFILE, summaryMd: 'One {years}\nline' };
    expect(summaryParagraphs(profile, now)).toHaveLength(1);
  });
});
