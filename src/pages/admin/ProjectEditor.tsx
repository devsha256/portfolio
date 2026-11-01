import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Field, inputClass } from '../../components/Field';
import { ProjectDto } from '../../domain/contracts';
import { useApi } from '../../hooks/useApi';
import { useSaveState } from '../../hooks/useSaveState';
import { deleteAt, sendJson } from '../../lib/admin-client';
import { projectDraftFrom, toProjectInput, type ProjectDraft } from '../../lib/admin-forms';
import { LoadNotice, NoticeLine } from './LoadNotice';

type TextField = Exclude<keyof ProjectDraft, 'description'>;

const FIELDS: { field: TextField; label: string; type?: string; hint?: string }[] = [
  { field: 'title', label: 'Title' },
  { field: 'company', label: 'Company' },
  { field: 'startMonth', label: 'Start month', type: 'month', hint: 'YYYY-MM' },
  { field: 'endMonth', label: 'End month', type: 'month', hint: 'Leave empty while the project is ongoing.' },
  { field: 'skills', label: 'Skills', hint: 'Comma separated, as they should appear, for example: DataWeave, MUnit' },
];

function useProjectEditor(project: ProjectDto | undefined) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => projectDraftFrom(project));
  const state = useSaveState();
  const change = (field: keyof ProjectDraft, value: string) => setDraft((current) => ({ ...current, [field]: value }));

  async function save() {
    const parsed = toProjectInput(draft);
    if (!parsed.ok) return state.invalid(parsed.errors);
    const request = project
      ? sendJson('PATCH', `/api/admin/projects/${project.id}`, parsed.input, ProjectDto)
      : sendJson('POST', '/api/admin/projects', parsed.input, ProjectDto);
    const result = await state.run(request, 'Saved');
    if (result && !project) navigate(`/admin/projects/${result.id}`, { replace: true });
  }

  async function remove() {
    if (!project || !window.confirm(`Delete “${project.title}”? This cannot be undone.`)) return;
    if (await state.run(deleteAt(`/api/admin/projects/${project.id}`), 'Deleted')) navigate('/admin/projects');
  }

  return { draft, change, save, remove, ...state };
}

function ProjectForm({ project }: { project?: ProjectDto }) {
  const editor = useProjectEditor(project);
  const { draft, errors, change, busy } = editor;
  return (
    <form noValidate onSubmit={(event) => { event.preventDefault(); void editor.save(); }} className="grid max-w-3xl gap-5">
      <h1 className="mb-3 text-3xl font-bold tracking-tight">{project ? `Edit “${project.title}”` : 'New project'}</h1>
      {FIELDS.map(({ field, label, type = 'text', hint }) => (
        <Field key={field} id={field} label={label} error={errors[field]} {...(hint && { hint })}>
          {(control) => <input {...control} type={type} value={draft[field]} onChange={(e) => change(field, e.target.value)} className={inputClass} />}
        </Field>
      ))}
      <Field id="description" label="Description" error={errors.description}>
        {(control) => <textarea {...control} rows={8} value={draft.description} onChange={(e) => change('description', e.target.value)} className={inputClass} />}
      </Field>
      <NoticeLine notice={editor.notice} />
      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy} className="button button--primary">
          {project ? 'Save changes' : 'Create project'}
        </button>
        {project && (
          <button type="button" disabled={busy} className="ml-auto text-sm text-red-700 underline dark:text-red-300" onClick={() => void editor.remove()}>
            Delete project
          </button>
        )}
      </div>
    </form>
  );
}

export default function ProjectEditor() {
  const { id = 'new' } = useParams();
  const existing = useApi(id === 'new' ? null : `/api/admin/projects/${id}`, ProjectDto);
  if (id === 'new') return <ProjectForm key="new" />;
  if (existing.status === 'ready') return <ProjectForm key={id} project={existing.data} />;
  return <LoadNotice status={existing.status} what="project" back="/admin/projects" />;
}
