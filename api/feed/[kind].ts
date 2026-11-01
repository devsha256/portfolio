import { feed } from '../_lib/feed';
import { serve } from '../_lib/serve';

export const GET = serve(feed);
