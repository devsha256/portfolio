import type { Credential } from '../content/schema';
import { formatDate } from '../lib/format';

/** Issuer logo, name, issuer and date, with links to verify and to the certificate copy. */
export function CredentialCard({ credential }: { credential: Credential }) {
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
          {credential.authority}, <time dateTime={credential.date}>{formatDate(credential.date)}</time>
        </p>
        <p className="mt-1 flex gap-4 text-sm">
          {credential.link && <a href={credential.link}>Verify</a>}
          <a href={credential.proof}>Certificate</a>
        </p>
      </div>
    </div>
  );
}
