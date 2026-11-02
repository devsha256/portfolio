import { readFileSync } from 'node:fs';
import { sql, type SQL } from 'drizzle-orm';
import { openDatabase, type Db } from './client';
import { credentials, posts, siteProfile } from './schema';
import { testDb } from './test-db';

const DOWN_0001 = new URL('./migrations/down/0001_admin_content.sql', import.meta.url);

function sqlStatements(script: string): string[] {
  const code = script
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n');
  return code
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

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

describe('migration 0001_admin_content', () => {
  const credential = (overrides: { kind?: string; name?: string; image?: string } = {}) => {
    const { kind = 'certification', name = 'MCD Level 1', image = '/img/certifications/mcd-l1.png' } = overrides;
    return sql`insert into credentials (kind, name, authority, issued_on, image, proof)
               values (${kind}, ${name}, 'MuleSoft', '2020-12-05', ${image}, 'https://drive.google.com/x')`;
  };
  const profile = (id: number) =>
    sql`insert into site_profile (id, tagline, career_start, summary_md) values (${id}, 't', '2020-02-24', 'With {years}')`;

  it('stores a valid credential and the single profile row', async () => {
    const db = await testDb();
    await db.execute(credential());
    await db.execute(profile(1));
    const [row] = await db.select().from(siteProfile);
    expect(row).toMatchObject({ id: 1, aboutMd: '' });
    expect(await db.select({ kind: credentials.kind }).from(credentials)).toEqual([{ kind: 'certification' }]);
  });

  it('rejects an unknown credential kind', async () => {
    await expectViolation(await testDb(), credential({ kind: 'award' }), 'credentials_kind_check');
  });

  it('rejects an image outside /img', async () => {
    await expectViolation(await testDb(), credential({ image: 'https://evil.dev/x.png' }), 'credentials_image_check');
  });

  it('rejects the same credential twice (kind, name, date)', async () => {
    const db = await testDb();
    await db.execute(credential());
    await expectViolation(db, credential(), 'credentials_kind_name_issued_on_key');
  });

  it('allows the same name under another kind', async () => {
    const db = await testDb();
    await db.execute(credential());
    await expect(db.execute(credential({ kind: 'learning' }))).resolves.toBeDefined();
  });

  it('allows only profile row 1', async () => {
    const db = await testDb();
    await expectViolation(db, profile(2), 'site_profile_id_check');
    await db.execute(profile(1));
    await expectViolation(db, profile(1), 'site_profile_pkey');
  });

  it('can be reversed with the down script and applied again', async () => {
    const database = await openDatabase('pglite://memory');
    await database.migrate();
    // The driver runs one statement per call; psql or the Neon SQL editor would run the file as is.
    for (const statement of sqlStatements(readFileSync(DOWN_0001, 'utf8'))) await database.db.execute(sql.raw(statement));
    await expect(database.db.execute(sql`select 1 from credentials`)).rejects.toMatchObject({
      cause: { message: expect.stringContaining('does not exist') },
    });
    expect(await database.db.select().from(posts)).toEqual([]);
    await database.migrate();
    expect(await database.db.select().from(credentials)).toEqual([]);
  });
});
