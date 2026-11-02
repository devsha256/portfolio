import { eq } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { siteProfile } from '../../db/schema';
import type { SiteProfile } from '../../src/domain/contracts';
import { DEFAULT_PROFILE } from '../../src/domain/site';

const PROFILE_ID = 1;
const profileColumns = {
  tagline: siteProfile.tagline,
  careerStart: siteProfile.careerStart,
  summaryMd: siteProfile.summaryMd,
  aboutMd: siteProfile.aboutMd,
};

/** A fresh database has no row yet; the ported default keeps the Home hero from rendering empty. */
export async function getProfile(db: Db): Promise<SiteProfile> {
  const [row] = await db.select(profileColumns).from(siteProfile).where(eq(siteProfile.id, PROFILE_ID));
  return row ?? DEFAULT_PROFILE;
}

/** One statement, safe to repeat: inserts row 1 or replaces it. */
export async function saveProfile(db: Db, profile: SiteProfile, now: Date): Promise<SiteProfile> {
  const values = { ...profile, updatedAt: now };
  const [row] = await db
    .insert(siteProfile)
    .values({ id: PROFILE_ID, ...values })
    .onConflictDoUpdate({ target: siteProfile.id, set: values })
    .returning(profileColumns);
  if (!row) throw new Error('Upsert returned no row');
  return row;
}
