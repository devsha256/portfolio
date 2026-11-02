import { Link, useSearchParams } from 'react-router';
import { SearchableCredentials } from '../../components/SearchableCredentials';
import { Tabs } from '../../components/Tabs';
import type { CredentialDto } from '../../domain/contracts';
import { useApi } from '../../hooks/useApi';
import { CredentialList } from '../../lib/api-schemas';
import { CREDENTIAL_TABS, tabFrom } from '../../lib/credentials';
import { LoadNotice } from './LoadNotice';

const editHref = (credential: CredentialDto) => `/admin/credentials/${credential.id}`;

function CredentialTabs({ items }: { items: readonly CredentialDto[] }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = tabFrom(searchParams);
  const counted = CREDENTIAL_TABS.map((tab) => ({
    ...tab,
    label: `${tab.label} (${items.filter((item) => item.kind === tab.kind).length})`,
  }));
  return (
    <>
      <div className="mb-6 flex justify-end">
        <Link to={`/admin/credentials/new?kind=${selected.kind}`} className="button button--primary">
          New credential
        </Link>
      </div>
      <Tabs
        label="Credential type"
        tabs={counted}
        selected={selected.id}
        onSelect={(id) => setSearchParams(id === CREDENTIAL_TABS[0].id ? {} : { tab: id }, { replace: true })}
      >
        <SearchableCredentials
          key={selected.id}
          items={items.filter((item) => item.kind === selected.kind)}
          label={selected.label.toLowerCase()}
          editHref={editHref}
        />
      </Tabs>
    </>
  );
}

export default function CredentialsAdmin() {
  const credentials = useApi('/api/admin/content/credentials', CredentialList);
  return (
    <section>
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Credentials</h1>
      {credentials.status === 'ready' ? (
        <CredentialTabs items={credentials.data.items} />
      ) : (
        <LoadNotice status={credentials.status} what="credentials" back="/admin/credentials" />
      )}
    </section>
  );
}
