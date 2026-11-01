const plural = (count: number, unit: string) => `${count} ${unit}${count === 1 ? '' : 's'}`;

/** Whole calendar months since `start`, phrased like "5 Years 8 Months" (ported from the Jekyll site). */
export function experienceSince(start: string, now: Date): string {
  const from = new Date(`${start}T00:00:00Z`);
  const months = (now.getUTCFullYear() - from.getUTCFullYear()) * 12 + now.getUTCMonth() - from.getUTCMonth();
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? plural(years, 'Year') : `${plural(years, 'Year')} ${plural(rest, 'Month')}`;
}
