import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Field, inputClass } from '../../components/Field';
import { CredentialDto, CredentialKind } from '../../domain/contracts';
import { useApi } from '../../hooks/useApi';
import { useSaveState } from '../../hooks/useSaveState';
import { deleteAt, sendJson } from '../../lib/admin-client';
import { credentialDraftFrom, toCredentialInput, type CredentialDraft, type FieldErrors } from '../../lib/admin-forms';
import { CREDENTIAL_TABS } from '../../lib/credentials';
import { KNOWN_IMAGES } from '../../lib/images';
import { LoadNotice, NoticeLine } from './LoadNotice';

type Change = (field: keyof CredentialDraft, value: string) => void;
type TextField = Exclude<keyof CredentialDraft, 'kind' | 'image'>;

const TEXT_FIELDS: { field: TextField; label: string; type?: string; hint?: string }[] = [
  { field: 'name', label: 'Name' },
  { field: 'authority', label: 'Issuer' },
  { field: 'issuedOn', label: 'Issued on', type: 'date' },
  { field: 'credentialId', label: 'Credential ID', hint: 'Optional, for example MCD-L2.' },
  { field: 'link', label: 'Verify link', type: 'url', hint: 'Optional. Where anyone can check the credential.' },
  { field: 'proof', label: 'Certificate link', type: 'url', hint: 'A copy of the certificate, for example a Drive file.' },
];

function useCredentialEditor(credential: CredentialDto | undefined, kind: CredentialKind) {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => credentialDraftFrom(credential, kind));
  const state = useSaveState();
  const change: Change = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  async function save() {
    const parsed = toCredentialInput(draft);
    if (!parsed.ok) return state.invalid(parsed.errors);
    const request = credential
      ? sendJson('PATCH', `/api/admin/credentials/${credential.id}`, parsed.input, CredentialDto)
      : sendJson('POST', '/api/admin/content/credentials', parsed.input, CredentialDto);
    const result = await state.run(request, 'Saved');
    if (result && !credential) navigate(`/admin/credentials/${result.id}`, { replace: true });
  }

  async function remove() {
    if (!credential || !window.confirm(`Delete “${credential.name}”? This cannot be undone.`)) return;
    if (await state.run(deleteAt(`/api/admin/credentials/${credential.id}`), 'Deleted')) navigate('/admin/credentials');
  }

  return { draft, change, save, remove, ...state };
}

function KindField({ value, change }: { value: CredentialKind; change: Change }) {
  return (
    <fieldset className="space-y-2">
      <legend className="font-medium">Kind</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {CREDENTIAL_TABS.map((tab) => (
          <label key={tab.kind} className="flex items-center gap-2">
            <input type="radio" name="kind" value={tab.kind} checked={value === tab.kind} onChange={() => change('kind', tab.kind)} />
            {tab.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ImageField({ value, error, change }: { value: string; error: string | undefined; change: Change }) {
  return (
    <div className="flex items-end gap-4">
      <img src={value} alt="Selected logo" width="56" height="56" className="h-14 w-14 rounded-md bg-white object-contain p-1.5" />
      <div className="flex-1">
        <Field id="image" label="Image" error={error} hint="Files in public/img. Add new logos to the repo first.">
          {(control) => (
            <select {...control} value={value} onChange={(e) => change('image', e.target.value)} className={inputClass}>
              {KNOWN_IMAGES.map((path) => (
                <option key={path} value={path}>
                  {path.replace('/img/', '')}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
    </div>
  );
}

function TextFields({ draft, errors, change }: { draft: CredentialDraft; errors: FieldErrors; change: Change }) {
  return TEXT_FIELDS.map(({ field, label, type = 'text', hint }) => (
    <Field key={field} id={field} label={label} error={errors[field]} {...(hint && { hint })}>
      {(control) => <input {...control} type={type} value={draft[field]} onChange={(e) => change(field, e.target.value)} className={inputClass} />}
    </Field>
  ));
}

function CredentialForm({ credential, kind }: { credential?: CredentialDto; kind: CredentialKind }) {
  const editor = useCredentialEditor(credential, kind);
  const { draft, errors, change, busy } = editor;
  return (
    <form noValidate onSubmit={(event) => { event.preventDefault(); void editor.save(); }} className="grid max-w-3xl gap-5">
      <h1 className="mb-3 text-3xl font-bold tracking-tight">{credential ? `Edit “${credential.name}”` : 'New credential'}</h1>
      <KindField value={draft.kind} change={change} />
      <TextFields draft={draft} errors={errors} change={change} />
      <ImageField value={draft.image} error={errors.image} change={change} />
      <NoticeLine notice={editor.notice} />
      <div className="flex items-center gap-4">
        <button type="submit" disabled={busy} className="button button--primary">
          {credential ? 'Save changes' : 'Create credential'}
        </button>
        {credential && (
          <button type="button" disabled={busy} className="ml-auto text-sm text-red-700 underline dark:text-red-300" onClick={() => void editor.remove()}>
            Delete credential
          </button>
        )}
      </div>
    </form>
  );
}

export default function CredentialEditor() {
  const { id = 'new' } = useParams();
  const [searchParams] = useSearchParams();
  const kind = CredentialKind.catch('certification').parse(searchParams.get('kind'));
  const existing = useApi(id === 'new' ? null : `/api/admin/credentials/${id}`, CredentialDto);
  if (id === 'new') return <CredentialForm key={`new-${kind}`} kind={kind} />;
  if (existing.status === 'ready') return <CredentialForm key={id} credential={existing.data} kind={existing.data.kind} />;
  return <LoadNotice status={existing.status} what="credential" back="/admin/credentials" />;
}
