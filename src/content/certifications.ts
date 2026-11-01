import data from './certifications.json';
import { credentialsFrom } from './schema';

export const certifications = credentialsFrom(data);
