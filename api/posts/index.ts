import { listPublishedPosts } from '../_lib/public-api.js';
import { serve } from '../_lib/serve.js';

export const GET = serve(listPublishedPosts);
