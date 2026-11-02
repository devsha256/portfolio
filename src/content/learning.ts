import data from '../../db/seed-data/credentials/learning.json';
import { credentialsFrom } from './schema';

export const learning = credentialsFrom(data);
