import { getPublishedPost } from '../_lib/public-api';
import { serve } from '../_lib/serve';

export const GET = serve(getPublishedPost);
