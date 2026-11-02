import { z } from 'zod';

export const POST_STATUSES = ['draft', 'published'] as const;
export const PostStatus = z.enum(POST_STATUSES);
export type PostStatus = z.infer<typeof PostStatus>;

export const Slug = z
  .string()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single dashes');

/** Accepts YYYY-MM or YYYY-MM-DD and stores the first day of that month. */
const Month = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])(-\d{2})?$/, 'Use YYYY-MM')
  .transform((value) => `${value.slice(0, 7)}-01`);

const IsoDateTime = z.iso.datetime({ offset: true });

export const PostInput = z.object({
  slug: Slug,
  title: z.string().trim().min(1, 'Enter a title').max(200),
  excerpt: z.string().trim().min(1, 'Enter a short excerpt').max(400),
  bodyMd: z.string().min(1, 'Write the post body').max(100_000),
  tags: z.array(Slug).max(10).default([]),
  featured: z.boolean().default(false),
});
export type PostInput = z.infer<typeof PostInput>;

export const PostPatch = PostInput.partial().extend({ status: PostStatus.optional() });
export type PostPatch = z.infer<typeof PostPatch>;

export const PostDto = PostInput.extend({
  id: z.number().int(),
  status: PostStatus,
  publishedAt: IsoDateTime.nullable(),
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
});
export type PostDto = z.infer<typeof PostDto>;

export const PostSummary = PostDto.omit({ bodyMd: true });
export type PostSummary = z.infer<typeof PostSummary>;

export const PostListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  tag: Slug.optional(),
});
export type PostListQuery = z.infer<typeof PostListQuery>;

const ProjectFields = z.object({
  title: z.string().trim().min(1, 'Enter a title').max(200),
  company: z.string().trim().min(1, 'Enter the company').max(120),
  startMonth: Month,
  endMonth: Month.nullable(),
  description: z.string().trim().min(1, 'Describe the project').max(4000),
  skills: z.array(z.string().trim().min(1).max(60)).max(20),
});

const periodIsOrdered = (p: { startMonth?: string; endMonth?: string | null }) =>
  !p.startMonth || !p.endMonth || p.endMonth >= p.startMonth;
export const PERIOD_ORDER_MESSAGE = 'End month must not be before start month';
const periodIssue = { message: PERIOD_ORDER_MESSAGE, path: ['endMonth'] };

export const ProjectInput = ProjectFields.refine(periodIsOrdered, periodIssue);
export type ProjectInput = z.infer<typeof ProjectInput>;

export const ProjectPatch = ProjectFields.partial().refine(periodIsOrdered, periodIssue);
export type ProjectPatch = z.infer<typeof ProjectPatch>;

export const ProjectDto = ProjectFields.extend({ id: z.number().int() });
export type ProjectDto = z.infer<typeof ProjectDto>;

export function pageOf<T extends z.ZodType>(item: T) {
  return z.object({ items: z.array(item), page: z.number().int(), limit: z.number().int(), total: z.number().int() });
}

export const CREDENTIAL_KINDS = ['certification', 'feedback', 'learning'] as const;
export const CredentialKind = z.enum(CREDENTIAL_KINDS);
export type CredentialKind = z.infer<typeof CredentialKind>;

const CredentialFields = z.object({
  kind: CredentialKind,
  name: z.string().trim().min(1, 'Enter a name').max(300),
  authority: z.string().trim().min(1, 'Enter the issuer').max(120),
  issuedOn: z.iso.date(),
  credentialId: z.string().trim().max(120).nullable().optional(),
  image: z.string().regex(/^\/img\//, 'Pick an image under /img'),
  link: z.url().nullable().optional(),
  proof: z.url(),
});

export const CredentialInput = CredentialFields;
export type CredentialInput = z.infer<typeof CredentialInput>;

/** No defaults, so a patch never resets fields the caller did not send. */
export const CredentialPatch = CredentialFields.partial();
export type CredentialPatch = z.infer<typeof CredentialPatch>;

export const CredentialDto = CredentialFields.extend({
  id: z.number().int(),
  credentialId: z.string().nullable(),
  link: z.url().nullable(),
});
export type CredentialDto = z.infer<typeof CredentialDto>;

export const YEARS_TOKEN = '{years}';

export const SiteProfile = z.object({
  tagline: z.string().trim().min(1, 'Enter a tagline').max(120),
  careerStart: z.iso.date(),
  summaryMd: z
    .string()
    .trim()
    .min(1, 'Write the summary')
    .max(4000)
    .refine((text) => text.includes(YEARS_TOKEN), `Keep ${YEARS_TOKEN} where the experience should appear`),
  aboutMd: z.string().trim().max(8000),
});
export type SiteProfile = z.infer<typeof SiteProfile>;
