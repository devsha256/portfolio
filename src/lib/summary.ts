import { experienceSince } from '../domain/experience';
import { SITE } from '../domain/site';

export function summaryParagraphs(now: Date): string[] {
  const years = experienceSince(SITE.careerStart, now);
  return SITE.summary.map((paragraph) => paragraph.replaceAll('{years}', years));
}
