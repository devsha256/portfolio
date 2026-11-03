import type { Db } from '../../db/client.js';
import { testDb } from '../../db/test-db.js';
import type { PostInput } from '../../src/domain/contracts.js';
import { ConflictError } from './errors.js';
import * as repo from './posts-repo.js';

const base: PostInput = { slug: 'a', title: 'A', excerpt: 'e', bodyMd: 'body', tags: ['mulesoft'], featured: false };
const day = (d: number) => new Date(Date.UTC(2025, 0, d));

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

async function published(slug: string, at: Date, tags: string[] = []) {
  const post = await repo.createPost(db, { ...base, slug, tags });
  const updated = await repo.updatePost(db, post.id, { status: 'published' }, at);
  if (!updated) throw new Error('post vanished');
  return updated;
}

describe('posts repo', () => {
  it('creates a draft and reads it back by id', async () => {
    const post = await repo.createPost(db, base);
    expect(post).toMatchObject({ slug: 'a', status: 'draft', publishedAt: null, tags: ['mulesoft'] });
    expect(await repo.getPost(db, post.id)).toEqual(post);
  });

  it('rejects a duplicate slug with ConflictError', async () => {
    await repo.createPost(db, base);
    await expect(repo.createPost(db, base)).rejects.toBeInstanceOf(ConflictError);
  });

  it('lists only published posts, newest first, with paging and total', async () => {
    await published('old', day(1));
    await published('new', day(3));
    await repo.createPost(db, { ...base, slug: 'draft' });
    const page1 = await repo.listPublished(db, { page: 1, limit: 1 });
    expect(page1.total).toBe(2);
    expect(page1.items.map((p) => p.slug)).toEqual(['new']);
    const page2 = await repo.listPublished(db, { page: 2, limit: 1 });
    expect(page2.items.map((p) => p.slug)).toEqual(['old']);
  });

  it('filters published posts by tag', async () => {
    await published('x', day(1), ['dataweave']);
    await published('y', day(2), ['cloudhub']);
    const result = await repo.listPublished(db, { page: 1, limit: 10, tag: 'dataweave' });
    expect(result.items.map((p) => p.slug)).toEqual(['x']);
    expect(result.total).toBe(1);
  });

  it('list items carry no body', async () => {
    await published('x', day(1));
    const { items } = await repo.listPublished(db, { page: 1, limit: 10 });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ slug: 'x', title: 'A' });
    expect(items[0]).not.toHaveProperty('bodyMd');
  });

  it('finds a published post by slug but hides drafts', async () => {
    await published('live', day(1));
    await repo.createPost(db, { ...base, slug: 'hidden' });
    expect((await repo.getPublishedBySlug(db, 'live'))?.slug).toBe('live');
    expect(await repo.getPublishedBySlug(db, 'hidden')).toBeNull();
  });

  it('first publish stamps the date; unpublish and republish keep it', async () => {
    const post = await published('p', day(5));
    expect(post.publishedAt).toBe(day(5).toISOString());
    const draft = await repo.updatePost(db, post.id, { status: 'draft' }, day(6));
    expect(draft).toMatchObject({ status: 'draft', publishedAt: day(5).toISOString() });
    const again = await repo.updatePost(db, post.id, { status: 'published' }, day(7));
    expect(again?.publishedAt).toBe(day(5).toISOString());
  });

  it('updates fields and bumps updatedAt', async () => {
    const post = await repo.createPost(db, base);
    const updated = await repo.updatePost(db, post.id, { title: 'B' }, day(9));
    expect(updated).toMatchObject({ title: 'B', updatedAt: day(9).toISOString() });
  });

  it('returns null when updating a missing post', async () => {
    expect(await repo.updatePost(db, 999, { title: 'B' }, day(1))).toBeNull();
  });

  it('rejects renaming onto an existing slug', async () => {
    await repo.createPost(db, base);
    const other = await repo.createPost(db, { ...base, slug: 'b' });
    await expect(repo.updatePost(db, other.id, { slug: 'a' }, day(1))).rejects.toBeInstanceOf(ConflictError);
  });

  it('lists all posts for the admin, drafts included, most recently updated first', async () => {
    const a = await repo.createPost(db, base);
    await repo.createPost(db, { ...base, slug: 'b' });
    await repo.updatePost(db, a.id, { title: 'touched' }, new Date(Date.now() + 60_000));
    expect((await repo.listAll(db)).map((p) => p.slug)).toEqual(['a', 'b']);
  });

  it('deletes idempotently', async () => {
    const post = await repo.createPost(db, base);
    await repo.deletePost(db, post.id);
    await expect(repo.deletePost(db, post.id)).resolves.toBeUndefined();
    expect(await repo.getPost(db, post.id)).toBeNull();
  });
});
