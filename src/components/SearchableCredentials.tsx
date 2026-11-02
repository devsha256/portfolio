import { useState } from 'react';
import type { CredentialDto } from '../domain/contracts';
import { searchCredentials } from '../lib/credentials';
import { CredentialGrid, type EditHref } from './CredentialCard';

const PAGE = 20;

type Props = { items: readonly CredentialDto[]; label: string; editHref?: EditHref };

/** Word search plus "Show more" paging over a credential list; used by the public learning tab and every admin tab. */
export function SearchableCredentials({ items, label, editHref }: Props) {
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const matches = searchCredentials(items, query);
  const visible = matches.slice(0, shown);
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <input
          type="search"
          aria-label={`Search ${label}`}
          placeholder="Search by name or issuer"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setShown(PAGE);
          }}
          className="w-full max-w-sm rounded-md border border-line bg-panel px-3 py-2"
        />
        <p aria-live="polite" className="text-sm text-muted">
          Showing {visible.length} of {matches.length}
        </p>
      </div>
      {matches.length === 0 ? (
        <p className="text-muted">{query ? `Nothing matches “${query}”. Try fewer words.` : `No ${label} yet.`}</p>
      ) : (
        <CredentialGrid items={visible} editHref={editHref} />
      )}
      {visible.length < matches.length && (
        <button type="button" className="button mt-8" onClick={() => setShown((count) => count + PAGE)}>
          Show {Math.min(PAGE, matches.length - visible.length)} more
        </button>
      )}
    </>
  );
}
