import data from './feedbacks.json';
import { credentialsFrom } from './schema';

export const feedbacks = credentialsFrom(data);
