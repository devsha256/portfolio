import { adminProjects } from '../../_lib/admin-api';
import { serve } from '../../_lib/serve';

export const GET = serve(adminProjects.GET);
export const POST = serve(adminProjects.POST);
