import { adminContent } from '../../_lib/admin-api.js';
import { serve } from '../../_lib/serve.js';

export const GET = serve(adminContent.GET);
export const POST = serve(adminContent.POST);
export const PUT = serve(adminContent.PUT);
