import { authAction } from '../_lib/auth.js';
import { serve } from '../_lib/serve.js';

export const GET = serve(authAction);
export const POST = serve(authAction);
