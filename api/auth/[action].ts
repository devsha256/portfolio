import { authAction } from '../_lib/auth';
import { serve } from '../_lib/serve';

export const GET = serve(authAction);
export const POST = serve(authAction);
