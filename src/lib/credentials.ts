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
