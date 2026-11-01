import { adminProject } from '../../_lib/admin-api';
import { serve } from '../../_lib/serve';

export const GET = serve(adminProject.GET);
export const PATCH = serve(adminProject.PATCH);
export const DELETE = serve(adminProject.DELETE);
