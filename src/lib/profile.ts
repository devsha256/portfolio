import { z } from 'zod';
import { experienceSince } from '../domain/experience';

const IsoDate = z.iso.date();

/** What {years} will read as today, or null while the career start is incomplete or in the future. */
export function yearsShown(careerStart: string, now: Date): string | null {
  if (!IsoDate.safeParse(careerStart).success) return null;
  if (new Date(`${careerStart}T00:00:00Z`) > now) return null;
  return experienceSince(careerStart, now);
}
