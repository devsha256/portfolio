import { YEARS_TOKEN } from '../domain/contracts';
import { experienceSince } from '../domain/experience';
import { DEFAULT_PROFILE } from '../domain/site';

export function summaryParagraphs(now: Date): string[] {
  const years = experienceSince(DEFAULT_PROFILE.careerStart, now);
  return DEFAULT_PROFILE.summaryMd.split(/\n\s*\n/).map((paragraph) => paragraph.replaceAll(YEARS_TOKEN, years));
}
