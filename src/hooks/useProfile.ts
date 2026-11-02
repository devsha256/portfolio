import type { SiteProfile } from '../domain/contracts';
import { DEFAULT_PROFILE } from '../domain/site';
import { Profile } from '../lib/api-schemas';
import { useApi } from './useApi';

/** The admin-edited profile; the ported default renders until it arrives, or if it never does, so the hero never jumps or empties. */
export function useProfile(): SiteProfile {
  const profile = useApi('/api/content/profile', Profile);
  return profile.status === 'ready' ? profile.data : DEFAULT_PROFILE;
}
