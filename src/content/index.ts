import certificationData from './certifications.json';
import feedbackData from './feedbacks.json';
import learningData from './learning.json';
import { credentialsFrom } from './schema';

export const certifications = credentialsFrom(certificationData);
export const feedbacks = credentialsFrom(feedbackData);
export const learning = credentialsFrom(learningData);
