import { readDatabaseUrl } from '../api/_lib/env.js';
import { openDatabase } from './client.js';

const database = await openDatabase(readDatabaseUrl());
await database.migrate();
await database.close();
console.log('Migrations applied');
