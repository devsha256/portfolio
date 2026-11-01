const DATE = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "2025-06-15T03:30:00Z" or "2025-06-15" → "15 Jun 2025". */
export function formatDate(iso: string): string {
  return DATE.format(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso));
}
