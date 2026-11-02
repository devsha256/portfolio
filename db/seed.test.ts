import { count, eq } from 'drizzle-orm';
import { DEFAULT_PROFILE } from '../src/domain/site';
import { credentials, posts, projects, siteProfile } from './schema';
import { seed } from './seeder';
import { testDb } from './test-db';

describe('seed', () => {
  it('ports 3 published posts and 7 projects, and is safe to run twice', async () => {
    const db = await testDb();
    await seed(db);
    await seed(db);
    const [postCount] = await db.select({ n: count() }).from(posts).where(eq(posts.status, 'published'));
    const [projectCount] = await db.select({ n: count() }).from(projects);
    expect(postCount?.n).toBe(3);
    expect(projectCount?.n).toBe(7);
  });

  it('keeps the original publish date of ported posts', async () => {
    const db = await testDb();
    await seed(db);
    const [row] = await db.select().from(posts).where(eq(posts.slug, 'dataweave-deep-dive'));
    expect(row?.publishedAt?.toISOString()).toBe('2025-06-15T03:30:00.000Z');
  });
});

describe('seed: admin content', () => {
  it('ports 6 certifications, 15 feedback items and 309 learning entries, and is safe to run twice', async () => {
    const db = await testDb();
    await seed(db);
    await seed(db);
    const rows = await db
      .select({ kind: credentials.kind, n: count() })
      .from(credentials)
      .groupBy(credentials.kind)
      .orderBy(credentials.kind);
    expect(rows).toEqual([
      { kind: 'certification', n: 6 },
      { kind: 'feedback', n: 15 },
      { kind: 'learning', n: 309 },
    ]);
  });

  it('maps a credential field by field', async () => {
    const db = await testDb();
    await seed(db);
    const [row] = await db.select().from(credentials).where(eq(credentials.credentialId, 'MCD-L2'));
    expect(row).toMatchObject({
      kind: 'certification',
      name: 'MuleSoft Certified Developer - Level 2',
      authority: 'MuleSoft',
      issuedOn: '2022-07-31',
      image: '/img/certifications/mcd-l2.png',
      link: 'https://trailhead.salesforce.com/en/credentials/mulesoftdeveloperii',
    });
  });

  it('creates the profile from the ported defaults', async () => {
    const db = await testDb();
    await seed(db);
    const rows = await db.select().from(siteProfile);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: 1, ...DEFAULT_PROFILE });
  });

  it('never overwrites a profile the admin has edited', async () => {
    const db = await testDb();
    await seed(db);
    await db.update(siteProfile).set({ tagline: 'Edited in admin' });
    await seed(db);
    const [row] = await db.select({ tagline: siteProfile.tagline }).from(siteProfile);
    expect(row?.tagline).toBe('Edited in admin');
  });
});
