import { z } from 'zod';
import { CredentialDto, PostDto, PostSummary, ProjectDto, SiteProfile, pageOf } from '../domain/contracts';

/** Module-level so useApi sees a stable schema reference between renders. */
export const PostPage = pageOf(PostSummary);
export const PostDetail = PostDto;
export const ProjectList = z.object({ items: z.array(ProjectDto) });
export const CredentialList = z.object({ items: z.array(CredentialDto) });
export const Profile = SiteProfile;
