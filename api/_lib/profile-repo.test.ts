import { count } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { siteProfile } from '../../db/schema.js';
import { testDb } from '../../db/test-db.js';
import type { SiteProfile } from '../../src/domain/contracts.js';
import { DEFAULT_PROFILE } from '../../src/domain/site.js';
import { getProfile, saveProfile } from './profile-repo.js';

const edited: SiteProfile = {
  tagline: 'Integration architect',
  careerStart: '2020-03-01',
  summaryMd: 'Over {years} building APIs.',
  aboutMd: 'Based in Kolkata.',
};

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

describe('profile repo', () => {
  it('falls back to the ported default when no profile row exists', async () => {
    expect(await getProfile(db)).toEqual(DEFAULT_PROFILE);
  });

  it('saves the profile and reads it back', async () => {
    expect(await saveProfile(db, edited, new Date())).toEqual(edited);
    expect(await getProfile(db)).toEqual(edited);
  });

  it('upserts: saving again replaces the single row', async () => {
    await saveProfile(db, DEFAULT_PROFILE, new Date());
    await saveProfile(db, edited, new Date());
    const [rows] = await db.select({ n: count() }).from(siteProfile);
    expect(rows?.n).toBe(1);
    expect(await getProfile(db)).toEqual(edited);
  });

  it('records when the profile was last saved', async () => {
    const at = new Date('2026-11-02T08:00:00Z');
    await saveProfile(db, edited, at);
    const [row] = await db.select({ updatedAt: siteProfile.updatedAt }).from(siteProfile);
    expect(row?.updatedAt).toEqual(at);
  });
});
