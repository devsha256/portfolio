import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { CredentialInput, PostInput, ProjectInput, type CredentialKind } from '../src/domain/contracts.js';
import { DEFAULT_PROFILE } from '../src/domain/site.js';
import type { Db } from './client.js';
import { credentials, posts, projects, siteProfile } from './schema.js';
import certificationData from './seed-data/credentials/certifications.json' with { type: 'json' };
import feedbackData from './seed-data/credentials/feedbacks.json' with { type: 'json' };
import learningData from './seed-data/credentials/learning.json' with { type: 'json' };
import postData from './seed-data/posts.json' with { type: 'json' };
import projectData from './seed-data/projects.json' with { type: 'json' };

const SeedPost = PostInput.extend({ publishedAt: z.iso.datetime().transform((value) => new Date(value)) });

/** The ported Jekyll JSON names the issue date `date`; the contract calls it `issuedOn`. */
const SeedCredentials = z.array(z.looseObject({ date: z.string() }));

function credentialRows(kind: CredentialKind, data: unknown): CredentialInput[] {
  return SeedCredentials.parse(data).map(({ date, ...rest }) => CredentialInput.parse({ ...rest, kind, issuedOn: date }));
}

/**
 * Upserts the content ported from the Jekyll site; safe to run any number of times.
 * The profile is only inserted when missing, so a rerun never overwrites the admin's edits.
 */
export async function seed(db: Db): Promise<void> {
  await seedPostsAndProjects(db);
  await seedCredentials(db);
  await db.insert(siteProfile).values({ id: 1, ...DEFAULT_PROFILE }).onConflictDoNothing({ target: siteProfile.id });
}

async function seedPostsAndProjects(db: Db): Promise<void> {
  const postRows = z.array(SeedPost).parse(postData).map((post) => ({ ...post, status: 'published' as const }));
  await db
    .insert(posts)
    .values(postRows)
    .onConflictDoUpdate({ target: posts.slug, set: excluded(['title', 'excerpt', 'body_md', 'tags', 'featured']) });
  await db
    .insert(projects)
    .values(z.array(ProjectInput).parse(projectData))
    .onConflictDoUpdate({
      target: [projects.company, projects.startMonth],
      set: excluded(['title', 'end_month', 'description', 'skills']),
    });
}

async function seedCredentials(db: Db): Promise<void> {
  const rows = [
    ...credentialRows('certification', certificationData),
    ...credentialRows('feedback', feedbackData),
    ...credentialRows('learning', learningData),
  ];
  await db
    .insert(credentials)
    .values(rows)
    .onConflictDoUpdate({
      target: [credentials.kind, credentials.proof],
      set: excluded(['name', 'authority', 'issued_on', 'credential_id', 'image', 'link']),
    });
}

function excluded(columns: string[]) {
  return Object.fromEntries(columns.map((column) => [column, sql.raw(`excluded.${column}`)]));
}
