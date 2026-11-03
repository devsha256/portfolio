import { readDatabaseUrl } from '../api/_lib/env.js';
import { openDatabase } from './client.js';
import { seed } from './seeder.js';

const database = await openDatabase(readDatabaseUrl());
await seed(database.db);
await database.close();
console.log('Seed applied');
