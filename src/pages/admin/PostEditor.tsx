import { lazy, Suspense, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Field, inputClass } from '../../components/Field';
import type { PostDto, PostStatus } from '../../domain/contracts';
import { slugify } from '../../domain/slug';
import { useApi } from '../../hooks/useApi';
import { useSaveState } from '../../hooks/useSaveState';
import { deleteAt, sendJson } from '../../lib/admin-client';
import { postDraftFrom, toPostInput, type FieldErrors, type PostDraft } from '../../lib/admin-forms';
import { PostDetail } from '../../lib/api-schemas';
import { LoadNotice, NoticeLine } from './LoadNotice';

const Markdown = lazy(() => import('../../components/Markdown'));
type Change = (field: keyof PostDraft, value: string | boolean) => void;

function usePostEditor(post: PostDto | undefined) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(post);
  const [draft, setDraft] = useState(() => postDraftFrom(post));
  const [slugEdited, setSlugEdited] = useState(Boolean(post));
  const state = useSaveState();

  const change: Change = (field, value) => {
    if (field === 'slug') setSlugEdited(true);
    const autoSlug = field === 'title' && !slugEdited ? { slug: slugify(String(value)) } : {};
    setDraft((current) => ({ ...current, [field]: value, ...autoSlug }));
  };

  async function save() {
    const parsed = toPostInput(draft);
    if (!parsed.ok) return state.invalid(parsed.errors);
    const request = saved
      ? sendJson('PATCH', `/api/admin/posts/${saved.id}`, parsed.input, PostDetail)
      : sendJson('POST', '/api/admin/posts', parsed.input, PostDetail);
    const result = await state.run(request, 'Saved');
    if (result && !saved) navigate(`/admin/posts/${result.id}`, { replace: true });
    if (result) setSaved(result);
  }

  async function setStatus(status: PostStatus) {
    if (!saved) return;
    const text = status === 'published' ? 'Published' : 'Moved to drafts';
    const result = await state.run(sendJson('PATCH', `/api/admin/posts/${saved.id}`, { status }, PostDetail), text);
    if (result) setSaved(result);
  }

  async function remove() {
    if (!saved || !window.confirm(`Delete “${saved.title}”? This cannot be undone.`)) return;
    if (await state.run(deleteAt(`/api/admin/posts/${saved.id}`), 'Deleted')) navigate('/admin');
  }

  return { draft, saved, change, save, setStatus, remove, ...state };
}

function BodyField({ value, error, onChange }: { value: string; error: string | undefined; onChange: (value: string) => void }) {
  const [preview, setPreview] = useState(false);
  return (
    <div className="space-y-2">
      <button type="button" aria-pressed={preview} onClick={() => setPreview(!preview)} className="text-sm underline">
        Preview
      </button>
      {preview ? (
        <Suspense fallback={<p className="text-muted">Loading preview…</p>}>
          <div className="rounded-md border border-line p-4">
            <Markdown>{value}</Markdown>
          </div>
        </Suspense>
      ) : (
        <Field id="bodyMd" label="Body (Markdown)" error={error}>
          {(control) => (
            <textarea {...control} rows={18} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} font-mono text-sm`} />
          )}
        </Field>
      )}
    </div>
  );
}

function PostFields({ draft, errors, change }: { draft: PostDraft; errors: FieldErrors; change: Change }) {
  const text = (field: 'title' | 'slug' | 'excerpt' | 'tags', label: string, hint?: string) => (
    <Field id={field} label={label} error={errors[field]} {...(hint && { hint })}>
      {(control) => <input {...control} value={draft[field]} onChange={(e) => change(field, e.target.value)} className={inputClass} />}
    </Field>
  );
  return (
    <div className="grid gap-5">
      {text('title', 'Title')}
      {text('slug', 'Slug', 'Lowercase words joined by dashes. Changing it breaks old links.')}
      {text('excerpt', 'Excerpt', 'One or two sentences for lists, feeds and search results.')}
      {text('tags', 'Tags', 'Comma separated, for example: mulesoft, dataweave')}
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={draft.featured} onChange={(e) => change('featured', e.target.checked)} />
        Feature this post
      </label>
      <BodyField value={draft.bodyMd} error={errors.bodyMd} onChange={(value) => change('bodyMd', value)} />
    </div>
  );
}

function PostForm({ post }: { post?: PostDto }) {
  const editor = usePostEditor(post);
  const { saved, busy } = editor;
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void editor.save();
      }}
      className="grid max-w-3xl gap-8"
    >
      <h1 className="text-3xl font-bold tracking-tight">{saved ? `Edit “${saved.title}”` : 'New post'}</h1>
      <PostFields draft={editor.draft} errors={editor.errors} change={editor.change} />
      <NoticeLine notice={editor.notice} />
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={busy} className="button button--primary">
          {saved ? 'Save changes' : 'Save draft'}
        </button>
        {saved && (
          <button type="button" disabled={busy} className="button" onClick={() => void editor.setStatus(saved.status === 'published' ? 'draft' : 'published')}>
            {saved.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        )}
        {saved?.status === 'published' && <Link to={`/blog/${saved.slug}`}>View post</Link>}
        {saved && (
          <button type="button" disabled={busy} className="ml-auto text-sm text-red-700 underline dark:text-red-300" onClick={() => void editor.remove()}>
            Delete post
          </button>
        )}
      </div>
    </form>
  );
}

export default function PostEditor() {
  const { id = 'new' } = useParams();
  const existing = useApi(id === 'new' ? null : `/api/admin/posts/${id}`, PostDetail);
  if (id === 'new') return <PostForm key="new" />;
  if (existing.status === 'ready') return <PostForm key={id} post={existing.data} />;
  return <LoadNotice status={existing.status} what="post" back="/admin" />;
}
