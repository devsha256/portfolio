import { and, arrayContains, count, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { posts } from '../../db/schema';
import type { PostDto, PostInput, PostListQuery, PostPatch, PostSummary } from '../../src/domain/contracts';
import { constrained } from './errors';

type PostRow = typeof posts.$inferSelect;

const SLUG_TAKEN = 'A post with this slug already exists';
const { bodyMd: _body, ...summaryColumns } = getTableColumns(posts);

function toDto(row: PostRow): PostDto {
  return {
    ...row,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toSummary(row: Omit<PostRow, 'bodyMd'>): PostSummary {
  const { bodyMd: _omit, ...summary } = toDto({ ...row, bodyMd: '' });
  return summary;
}

const isPublished = eq(posts.status, 'published');

export async function listPublished(db: Db, query: PostListQuery) {
  const where = query.tag ? and(isPublished, arrayContains(posts.tags, [query.tag])) : isPublished;
  const [rows, [totals]] = await Promise.all([
    db
      .select(summaryColumns)
      .from(posts)
      .where(where)
      .orderBy(desc(posts.publishedAt))
      .limit(query.limit)
      .offset((query.page - 1) * query.limit),
    db.select({ total: count() }).from(posts).where(where),
  ]);
  return { items: rows.map(toSummary), page: query.page, limit: query.limit, total: totals?.total ?? 0 };
}

export async function getPublishedBySlug(db: Db, slug: string): Promise<PostDto | null> {
  const [row] = await db.select().from(posts).where(and(isPublished, eq(posts.slug, slug)));
  return row ? toDto(row) : null;
}

export async function listAll(db: Db): Promise<PostSummary[]> {
  const rows = await db.select(summaryColumns).from(posts).orderBy(desc(posts.updatedAt), desc(posts.id));
  return rows.map(toSummary);
}

export async function getPost(db: Db, id: number): Promise<PostDto | null> {
  const [row] = await db.select().from(posts).where(eq(posts.id, id));
  return row ? toDto(row) : null;
}

export async function createPost(db: Db, input: PostInput): Promise<PostDto> {
  const [row] = await constrained(() => db.insert(posts).values(input).returning(), { unique: SLUG_TAKEN });
  if (!row) throw new Error('Insert returned no row');
  return toDto(row);
}

/** The first publish stamps `publishedAt`; it is never moved or cleared, so this is one atomic statement. */
export async function updatePost(db: Db, id: number, patch: PostPatch, now: Date): Promise<PostDto | null> {
  const publishedAt = patch.status === 'published' ? sql`coalesce(${posts.publishedAt}, ${now.toISOString()})` : undefined;
  const [row] = await constrained(
    () =>
      db
        .update(posts)
        .set({ ...patch, ...(publishedAt && { publishedAt }), updatedAt: now })
        .where(eq(posts.id, id))
        .returning(),
    { unique: SLUG_TAKEN },
  );
  return row ? toDto(row) : null;
}

export async function deletePost(db: Db, id: number): Promise<void> {
  await db.delete(posts).where(eq(posts.id, id));
}
