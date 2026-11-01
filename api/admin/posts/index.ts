import { adminPosts } from '../../_lib/admin-api';
import { serve } from '../../_lib/serve';

export const GET = serve(adminPosts.GET);
export const POST = serve(adminPosts.POST);
