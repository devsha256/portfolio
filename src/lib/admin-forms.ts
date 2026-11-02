import type { z } from 'zod';
import { PostInput, ProjectInput, type PostDto, type ProjectDto } from '../domain/contracts';
import { slugify } from '../domain/slug';

/** What the editors hold: plain strings for inputs, converted to contract types only on save. */
export type PostDraft = { title: string; slug: string; excerpt: string; tags: string; featured: boolean; bodyMd: string };
export type ProjectDraft = { title: string; company: string; startMonth: string; endMonth: string; description: string; skills: string };

export type FieldErrors = Record<string, string>;
type Parsed<T> = { ok: true; input: T } | { ok: false; errors: FieldErrors };

const splitList = (text: string) =>
  text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

/** First message per field, keyed by the contract's field name. */
function firstErrors(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form');
    errors[field] ??= issue.message;
  }
  return errors;
}

function parse<T>(schema: z.ZodType<T>, value: unknown): Parsed<T> {
  const result = schema.safeParse(value);
  return result.success ? { ok: true, input: result.data } : { ok: false, errors: firstErrors(result.error) };
}

export function postDraftFrom(post?: PostDto): PostDraft {
  if (!post) return { title: '', slug: '', excerpt: '', tags: '', featured: false, bodyMd: '' };
  return { ...post, tags: post.tags.join(', ') };
}

export function toPostInput(draft: PostDraft): Parsed<PostInput> {
  return parse(PostInput, { ...draft, tags: splitList(draft.tags).map(slugify).filter(Boolean) });
}

export function projectDraftFrom(project?: ProjectDto): ProjectDraft {
  if (!project) return { title: '', company: '', startMonth: '', endMonth: '', description: '', skills: '' };
  return {
    ...project,
    startMonth: project.startMonth.slice(0, 7),
    endMonth: project.endMonth?.slice(0, 7) ?? '',
    skills: project.skills.join(', '),
  };
}

export function toProjectInput(draft: ProjectDraft): Parsed<ProjectInput> {
  return parse(ProjectInput, { ...draft, endMonth: draft.endMonth || null, skills: splitList(draft.skills) });
}
