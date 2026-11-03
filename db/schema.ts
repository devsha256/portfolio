import { sql } from 'drizzle-orm';
import { bigint, boolean, check, date, index, pgTable, smallint, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { CREDENTIAL_KINDS, POST_STATUSES } from '../src/domain/contracts.js';

const id = () => bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity();
const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const posts = pgTable(
  'posts',
  {
    id: id(),
    slug: text('slug').notNull().unique('posts_slug_key'),
    title: text('title').notNull(),
    excerpt: text('excerpt').notNull(),
    bodyMd: text('body_md').notNull(),
    tags: text('tags').array().notNull().default(sql`'{}'`),
    status: text('status', { enum: POST_STATUSES }).notNull().default('draft'),
    featured: boolean('featured').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check('posts_status_check', sql`${t.status} in ('draft', 'published')`),
    check('posts_published_at_check', sql`${t.status} = 'draft' or ${t.publishedAt} is not null`),
    index('posts_published_at_idx').on(t.publishedAt.desc()).where(sql`${t.status} = 'published'`),
    index('posts_tags_idx').using('gin', t.tags),
  ],
);

export const projects = pgTable(
  'projects',
  {
    id: id(),
    title: text('title').notNull(),
    company: text('company').notNull(),
    startMonth: date('start_month', { mode: 'string' }).notNull(),
    endMonth: date('end_month', { mode: 'string' }),
    description: text('description').notNull(),
    skills: text('skills').array().notNull().default(sql`'{}'`),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique('projects_company_start_month_key').on(t.company, t.startMonth),
    check('projects_period_check', sql`${t.endMonth} is null or ${t.endMonth} >= ${t.startMonth}`),
    index('projects_start_month_idx').on(t.startMonth.desc()),
  ],
);

export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: text('id').primaryKey(),
    githubLogin: text('github_login').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('admin_sessions_expires_at_idx').on(t.expiresAt)],
);

export const credentials = pgTable(
  'credentials',
  {
    id: id(),
    kind: text('kind', { enum: CREDENTIAL_KINDS }).notNull(),
    name: text('name').notNull(),
    authority: text('authority').notNull(),
    issuedOn: date('issued_on', { mode: 'string' }).notNull(),
    credentialId: text('credential_id'),
    image: text('image').notNull(),
    link: text('link'),
    proof: text('proof').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check('credentials_kind_check', sql`${t.kind} in ('certification', 'feedback', 'learning')`),
    check('credentials_image_check', sql`${t.image} like '/img/%'`),
    // One certificate file is one credential; LinkedIn issues distinct certificates with the same title and date.
    unique('credentials_kind_proof_key').on(t.kind, t.proof),
    index('credentials_kind_issued_on_idx').on(t.kind, t.issuedOn.desc()),
  ],
);

/** A single row (id = 1) holding the editable Home/About text; writes upsert on the key. */
export const siteProfile = pgTable(
  'site_profile',
  {
    id: smallint('id').primaryKey(),
    tagline: text('tagline').notNull(),
    careerStart: date('career_start', { mode: 'string' }).notNull(),
    summaryMd: text('summary_md').notNull(),
    aboutMd: text('about_md').notNull().default(''),
    updatedAt: updatedAt(),
  },
  (t) => [check('site_profile_id_check', sql`${t.id} = 1`)],
);
