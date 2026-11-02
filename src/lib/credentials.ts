import type { CredentialDto } from '../domain/contracts';

/** Case-insensitive; every word must appear in the name or the issuer. */
export function searchCredentials(list: readonly CredentialDto[], query: string): readonly CredentialDto[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return list;
  return list.filter((item) => {
    const text = `${item.name} ${item.authority}`.toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

/** Tab ids double as the `?tab=` value on both the public and the admin credentials pages. */
export const CREDENTIAL_TABS = [
  { id: 'certifications', label: 'Certifications', kind: 'certification' },
  { id: 'feedback', label: 'Feedback', kind: 'feedback' },
  { id: 'learning', label: 'Learning history', kind: 'learning' },
] as const;

export type CredentialTab = (typeof CREDENTIAL_TABS)[number];

export function tabFrom(params: URLSearchParams): CredentialTab {
  return CREDENTIAL_TABS.find((tab) => tab.id === params.get('tab')) ?? CREDENTIAL_TABS[0];
}
