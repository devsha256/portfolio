import data from '../../db/seed-data/credentials/certifications.json';
import { credentialsFrom } from './schema';

export const certifications = credentialsFrom(data);
