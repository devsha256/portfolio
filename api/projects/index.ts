import { listPublicProjects } from '../_lib/public-api';
import { serve } from '../_lib/serve';

export const GET = serve(listPublicProjects);
