import { adminPost } from '../../_lib/admin-api';
import { serve } from '../../_lib/serve';

export const GET = serve(adminPost.GET);
export const PATCH = serve(adminPost.PATCH);
export const DELETE = serve(adminPost.DELETE);
