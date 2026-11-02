import { YEARS_TOKEN, type SiteProfile } from '../domain/contracts';
import { experienceSince } from '../domain/experience';

/** The summary's blank-line-separated paragraphs, with every {years} filled from the career start. */
export function summaryParagraphs(profile: Pick<SiteProfile, 'careerStart' | 'summaryMd'>, now: Date): string[] {
  const years = experienceSince(profile.careerStart, now);
  return profile.summaryMd
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => paragraph.replaceAll(YEARS_TOKEN, years));
}
