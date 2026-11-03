import { adminPost } from '../../_lib/admin-api.js';
import { serve } from '../../_lib/serve.js';

export const GET = serve(adminPost.GET);
export const PATCH = serve(adminPost.PATCH);
export const DELETE = serve(adminPost.DELETE);
