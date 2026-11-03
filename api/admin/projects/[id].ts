import { adminProject } from '../../_lib/admin-api.js';
import { serve } from '../../_lib/serve.js';

export const GET = serve(adminProject.GET);
export const PATCH = serve(adminProject.PATCH);
export const DELETE = serve(adminProject.DELETE);
