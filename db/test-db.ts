import { openDatabase } from './client';

/** A fresh, migrated in-memory Postgres for one test. */
export async function testDb() {
  const database = await openDatabase('pglite://memory');
  await database.migrate();
  return database.db;
}
