import { adminProjects } from '../../_lib/admin-api.js';
import { serve } from '../../_lib/serve.js';

export const GET = serve(adminProjects.GET);
export const POST = serve(adminProjects.POST);
