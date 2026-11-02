import type { CredentialKind } from '../domain/contracts';
import { CredentialList } from '../lib/api-schemas';
import { useApi } from './useApi';

/** One kind of credential, newest first, from the CDN-cached content endpoint. */
export function useCredentials(kind: CredentialKind) {
  return useApi(`/api/content/credentials?kind=${kind}`, CredentialList);
}
