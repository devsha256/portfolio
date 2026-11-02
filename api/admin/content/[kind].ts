import { adminContent } from '../../_lib/admin-api';
import { serve } from '../../_lib/serve';

export const GET = serve(adminContent.GET);
export const POST = serve(adminContent.POST);
export const PUT = serve(adminContent.PUT);
