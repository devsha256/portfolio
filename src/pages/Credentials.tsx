import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { CredentialGrid, CredentialsOf } from '../components/CredentialCard';
import { Seo } from '../components/Seo';
import { Tabs } from '../components/Tabs';
import type { CredentialDto } from '../domain/contracts';
import { useCredentials } from '../hooks/useCredentials';
import { searchCredentials } from '../lib/credentials';

const PAGE = 20;
const TABS = [
  { id: 'certifications', label: 'Certifications', kind: 'certification' },
  { id: 'feedback', label: 'Feedback', kind: 'feedback' },
  { id: 'learning', label: 'Learning history', kind: 'learning' },
] as const;

function LearningSearch({ items }: { items: readonly CredentialDto[] }) {
  const [query, setQuery] = useState('');
  const [shown, setShown] = useState(PAGE);
  const matches = searchCredentials(items, query);
  const visible = matches.slice(0, shown);
  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <input
          type="search"
          aria-label="Search learning history"
          placeholder="Search by course or provider"
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
      {matches.length === 0 ? <p className="text-muted">No course matches “{query}”. Try fewer words.</p> : <CredentialGrid items={visible} />}
      {visible.length < matches.length && (
        <button type="button" className="button mt-8" onClick={() => setShown((count) => count + PAGE)}>
          Show {Math.min(PAGE, matches.length - visible.length)} more
        </button>
      )}
    </>
  );
}

function LearningHistory() {
  const learning = useCredentials('learning');
  if (learning.status === 'loading') return <p className="text-muted">Loading learning history…</p>;
  if (learning.status !== 'ready') return <p>The learning history could not be loaded. Refresh to try again.</p>;
  return <LearningSearch items={learning.data.items} />;
}

export default function Credentials() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = TABS.find((tab) => tab.id === searchParams.get('tab')) ?? TABS[0];
  return (
    <>
      <Seo title="Credentials" description="Certifications, peer feedback and learning history." path="/credentials" />
      <h1 className="pt-12 text-5xl font-bold tracking-tight">Credentials</h1>
      <p className="mt-4 mb-10 max-w-prose text-lg text-muted">Certifications, peer feedback and learning history.</p>
      <Tabs
        label="Credential type"
        tabs={TABS}
        selected={selected.id}
        onSelect={(id) => setSearchParams(id === TABS[0].id ? {} : { tab: id }, { replace: true })}
      >
        {selected.kind === 'learning' ? (
          <LearningHistory />
        ) : (
          <CredentialsOf key={selected.kind} kind={selected.kind} label={selected.label.toLowerCase()} />
        )}
      </Tabs>
    </>
  );
}
