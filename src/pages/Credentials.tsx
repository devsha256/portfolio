import { useSearchParams } from 'react-router';
import { CredentialsOf } from '../components/CredentialCard';
import { SearchableCredentials } from '../components/SearchableCredentials';
import { Seo } from '../components/Seo';
import { Tabs } from '../components/Tabs';
import { useCredentials } from '../hooks/useCredentials';
import { CREDENTIAL_TABS, tabFrom } from '../lib/credentials';

function LearningHistory() {
  const learning = useCredentials('learning');
  if (learning.status === 'loading') return <p className="text-muted">Loading learning history…</p>;
  if (learning.status !== 'ready') return <p>The learning history could not be loaded. Refresh to try again.</p>;
  return <SearchableCredentials items={learning.data.items} label="learning history" />;
}

export default function Credentials() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = tabFrom(searchParams);
  return (
    <>
      <Seo title="Credentials" description="Certifications, peer feedback and learning history." path="/credentials" />
      <h1 className="pt-12 text-5xl font-bold tracking-tight">Credentials</h1>
      <p className="mt-4 mb-10 max-w-prose text-lg text-muted">Certifications, peer feedback and learning history.</p>
      <Tabs
        label="Credential type"
        tabs={CREDENTIAL_TABS}
        selected={selected.id}
        onSelect={(id) => setSearchParams(id === CREDENTIAL_TABS[0].id ? {} : { tab: id }, { replace: true })}
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
