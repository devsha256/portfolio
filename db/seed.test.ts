import { count, eq } from 'drizzle-orm';
import { posts, projects } from './schema';
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
