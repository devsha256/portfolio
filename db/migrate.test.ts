import { sql, type SQL } from 'drizzle-orm';
import { openDatabase, type Db } from './client';
import { posts } from './schema';
import { testDb } from './test-db';

/** Asserts that the named constraint (not a missing table or a typo) rejected the statement. */
async function expectViolation(db: Db, statement: SQL, constraint: string) {
  await expect(db.execute(statement)).rejects.toMatchObject({ cause: { message: expect.stringContaining(constraint) } });
}

describe('migrations', () => {
  it('can run twice and leaves working tables', async () => {
    const { db, migrate } = await openDatabase('pglite://memory');
    await migrate();
    await migrate();
    await db.execute(sql`insert into posts (slug, title, excerpt, body_md) values ('a', 'A', 'e', 'b')`);
    expect(await db.select({ status: posts.status }).from(posts)).toEqual([{ status: 'draft' }]);
  });

  it('rejects a published post without published_at', async () => {
    const statement = sql`insert into posts (slug, title, excerpt, body_md, status) values ('a', 'A', 'e', 'b', 'published')`;
    await expectViolation(await testDb(), statement, 'posts_published_at_check');
  });

  it('rejects an unknown post status', async () => {
    const statement = sql`insert into posts (slug, title, excerpt, body_md, status, published_at) values ('a', 'A', 'e', 'b', 'archived', now())`;
    await expectViolation(await testDb(), statement, 'posts_status_check');
  });

  it('rejects a project that ends before it starts', async () => {
    const statement = sql`insert into projects (title, company, start_month, end_month, description, skills)
                          values ('T', 'C', '2024-05-01', '2024-01-01', 'd', '{}')`;
    await expectViolation(await testDb(), statement, 'projects_period_check');
  });
});
