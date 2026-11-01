import { z } from 'zod';
import { PostDto, PostSummary, ProjectDto, pageOf } from '../domain/contracts';

/** Module-level so useApi sees a stable schema reference between renders. */
export const PostPage = pageOf(PostSummary);
export const PostDetail = PostDto;
export const ProjectList = z.object({ items: z.array(ProjectDto) });
