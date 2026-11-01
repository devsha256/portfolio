import { sql } from 'drizzle-orm';
import { openDatabase } from './client';
import { testDb } from './test-db';

const freshDb = testDb;

describe('migrations', () => {
  it('can run twice without error', async () => {
    const { migrate } = await openDatabase('pglite://memory');
    await migrate();
    await expect(migrate()).resolves.toBeUndefined();
  });

  it('rejects a published post without published_at', async () => {
    const db = await freshDb();
    await expect(
      db.execute(sql`insert into posts (slug, title, excerpt, body_md, status) values ('a', 'A', 'e', 'b', 'published')`),
    ).rejects.toThrow();
  });

  it('rejects an unknown post status', async () => {
    const db = await freshDb();
    await expect(
      db.execute(sql`insert into posts (slug, title, excerpt, body_md, status) values ('a', 'A', 'e', 'b', 'archived')`),
    ).rejects.toThrow();
  });

  it('rejects a project that ends before it starts', async () => {
    const db = await freshDb();
    await expect(
      db.execute(
        sql`insert into projects (title, company, start_month, end_month, description, skills)
            values ('T', 'C', '2024-05-01', '2024-01-01', 'd', '{}')`,
      ),
    ).rejects.toThrow();
  });
});
