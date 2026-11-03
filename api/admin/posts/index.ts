import { adminPosts } from '../../_lib/admin-api.js';
import { serve } from '../../_lib/serve.js';

export const GET = serve(adminPosts.GET);
export const POST = serve(adminPosts.POST);
