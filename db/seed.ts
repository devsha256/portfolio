import { readDatabaseUrl } from '../api/_lib/env';
import { openDatabase } from './client';
import { seed } from './seeder';

const database = await openDatabase(readDatabaseUrl());
await seed(database.db);
await database.close();
console.log('Seed applied');
