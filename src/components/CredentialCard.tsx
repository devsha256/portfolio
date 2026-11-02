import { Link } from 'react-router';
import type { CredentialDto, CredentialKind } from '../domain/contracts';
import { useCredentials } from '../hooks/useCredentials';
import { formatDate } from '../lib/format';

/** Issuer logo, name, issuer and date, with links to verify and to the certificate copy; admin lists add an edit link. */
function CredentialCard({ credential, editTo }: { credential: CredentialDto; editTo?: string | undefined }) {
  return (
    <div className="flex h-full items-center gap-4 rounded-lg border border-line bg-panel p-4">
      {/* Issuer logos are drawn for light backgrounds, so they sit on a white tile in both themes. */}
      <img
        src={credential.image}
        alt=""
        width="56"
        height="56"
        loading="lazy"
        className="h-14 w-14 shrink-0 rounded-md bg-white object-contain p-1.5"
      />
      <div className="min-w-0">
        <p className="font-semibold leading-snug">{credential.name}</p>
        <p className="text-sm text-muted">
          {credential.authority}, <time dateTime={credential.issuedOn}>{formatDate(credential.issuedOn)}</time>
        </p>
        <p className="mt-1 flex gap-4 text-sm">
          {credential.link && <a href={credential.link}>Verify</a>}
          <a href={credential.proof}>Certificate</a>
          {editTo && (
            <Link to={editTo} aria-label={`Edit ${credential.name}`} className="font-medium">
              Edit
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}

export type EditHref = (credential: CredentialDto) => string;

export function CredentialGrid({ items, editHref }: { items: readonly CredentialDto[]; editHref?: EditHref | undefined }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.id}>
          <CredentialCard credential={item} editTo={editHref?.(item)} />
        </li>
      ))}
    </ul>
  );
}

/** Loads one kind and renders its grid, with plain loading and failure messages. */
export function CredentialsOf({ kind, label }: { kind: CredentialKind; label: string }) {
  const credentials = useCredentials(kind);
  if (credentials.status === 'loading') return <p className="text-muted">Loading {label}…</p>;
  if (credentials.status !== 'ready') return <p>The {label} could not be loaded. Refresh to try again.</p>;
  if (credentials.data.items.length === 0) return <p className="text-muted">No {label} yet.</p>;
  return <CredentialGrid items={credentials.data.items} />;
}
