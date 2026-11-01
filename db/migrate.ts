import { readDatabaseUrl } from '../api/_lib/env';
import { openDatabase } from './client';

const database = await openDatabase(readDatabaseUrl());
await database.migrate();
await database.close();
console.log('Migrations applied');
