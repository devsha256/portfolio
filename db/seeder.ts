import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { PostInput, ProjectInput } from '../src/domain/contracts';
import type { Db } from './client';
import { posts, projects } from './schema';
import postData from './seed-data/posts.json';
import projectData from './seed-data/projects.json';

const SeedPost = PostInput.extend({ publishedAt: z.iso.datetime().transform((value) => new Date(value)) });

/** Upserts the content ported from the Jekyll site; safe to run any number of times. */
export async function seed(db: Db): Promise<void> {
  const postRows = z.array(SeedPost).parse(postData).map((post) => ({ ...post, status: 'published' as const }));
  const projectRows = z.array(ProjectInput).parse(projectData);
  await db
    .insert(posts)
    .values(postRows)
    .onConflictDoUpdate({ target: posts.slug, set: excluded(['title', 'excerpt', 'body_md', 'tags', 'featured']) });
  await db
    .insert(projects)
    .values(projectRows)
    .onConflictDoUpdate({
      target: [projects.company, projects.startMonth],
      set: excluded(['title', 'end_month', 'description', 'skills']),
    });
}

function excluded(columns: string[]) {
  return Object.fromEntries(columns.map((column) => [column, sql.raw(`excluded.${column}`)]));
}
