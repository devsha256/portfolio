import data from '../../db/seed-data/credentials/feedbacks.json';
import { credentialsFrom } from './schema';

export const feedbacks = credentialsFrom(data);
