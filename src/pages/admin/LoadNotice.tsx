import { Link } from 'react-router';

type LoadStatus = 'loading' | 'not-found' | 'unauthorized' | 'error';

/** What an admin screen shows while its record loads or when it cannot. */
export function LoadNotice({ status, what, back }: { status: LoadStatus; what: string; back: string }) {
  if (status === 'loading') return <p className="text-muted">Loading {what}…</p>;
  const text =
    status === 'not-found'
      ? `This ${what} does not exist. It may have been deleted.`
      : status === 'unauthorized'
        ? 'Your session ended. Sign in again to continue.'
        : `The ${what} could not be loaded. Refresh to try again.`;
  return (
    <p>
      {text} <Link to={back}>Back to the list</Link>
    </p>
  );
}

export function NoticeLine({ notice }: { notice: { kind: 'status' | 'alert'; text: string } | null }) {
  if (!notice) return null;
  return (
    <p role={notice.kind} className={notice.kind === 'alert' ? 'font-medium text-red-700 dark:text-red-300' : 'font-medium text-live'}>
      {notice.text}
    </p>
  );
}
