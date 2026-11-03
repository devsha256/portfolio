import { adminCredential } from '../../_lib/admin-api.js';
import { serve } from '../../_lib/serve.js';

export const GET = serve(adminCredential.GET);
export const PATCH = serve(adminCredential.PATCH);
export const DELETE = serve(adminCredential.DELETE);
