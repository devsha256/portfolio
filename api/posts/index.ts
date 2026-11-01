import { listPublishedPosts } from '../_lib/public-api';
import { serve } from '../_lib/serve';

export const GET = serve(listPublishedPosts);
