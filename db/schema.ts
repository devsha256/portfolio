import { sql } from 'drizzle-orm';
import { bigint, boolean, check, date, index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { POST_STATUSES } from '../src/domain/contracts';

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
