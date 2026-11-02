import { useState } from 'react';
import { Field, inputClass } from '../../components/Field';
import { PreviewField } from '../../components/PreviewField';
import { Summary } from '../../components/Summary';
import type { SiteProfile } from '../../domain/contracts';
import { useApi } from '../../hooks/useApi';
import { useSaveState } from '../../hooks/useSaveState';
import { sendJson } from '../../lib/admin-client';
import { toProfileInput } from '../../lib/admin-forms';
import { Profile } from '../../lib/api-schemas';
import { yearsShown } from '../../lib/profile';
import { LoadNotice, NoticeLine } from './LoadNotice';

type Change = (field: keyof SiteProfile, value: string) => void;

function useProfileEditor(saved: SiteProfile) {
  const [draft, setDraft] = useState(saved);
  const state = useSaveState();
  const change: Change = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  async function save() {
    const parsed = toProfileInput(draft);
    if (!parsed.ok) return state.invalid(parsed.errors);
    await state.run(sendJson('PUT', '/api/admin/content/profile', parsed.input, Profile), 'Saved');
  }

  return { draft, change, save, ...state };
}

function YearsLine({ careerStart }: { careerStart: string }) {
  const [now] = useState(() => new Date());
  const years = yearsShown(careerStart, now);
  return (
    <p aria-live="polite" className="text-sm text-muted">
      {years ? `Years shown today: ${years}` : 'Enter a full career start date in the past to see the years.'}
    </p>
  );
}

/** The date that drives {years}, with a live line showing what visitors will read today. */
function CareerStartField({ value, error, change }: { value: string; error: string | undefined; change: Change }) {
  return (
    <div className="space-y-1.5">
      <Field id="careerStart" label="Career start" error={error}>
        {(control) => <input {...control} type="date" value={value} onChange={(e) => change('careerStart', e.target.value)} className={inputClass} />}
      </Field>
      <YearsLine careerStart={value} />
    </div>
  );
}

function ProfileForm({ saved }: { saved: SiteProfile }) {
  const { draft, errors, change, save, notice, busy } = useProfileEditor(saved);
  return (
    <form noValidate onSubmit={(event) => { event.preventDefault(); void save(); }} className="grid max-w-3xl gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      <p className="-mt-3 text-muted">The tagline and summary appear on Home and About. Changes show on the site within 5 minutes.</p>
      <Field id="tagline" label="Tagline" error={errors.tagline} hint="One line under your name on the home page.">
        {(control) => <input {...control} value={draft.tagline} onChange={(e) => change('tagline', e.target.value)} className={inputClass} />}
      </Field>
      <CareerStartField value={draft.careerStart} error={errors.careerStart} change={change} />
      <PreviewField
        id="summaryMd"
        label="Summary"
        value={draft.summaryMd}
        error={errors.summaryMd}
        onChange={(value) => change('summaryMd', value)}
        hint="Separate paragraphs with a blank line. Write {years} where the experience should appear."
        preview={(value) => <Summary profile={{ ...draft, summaryMd: value }} />}
      />
      <PreviewField
        id="aboutMd"
        label="About introduction"
        value={draft.aboutMd}
        error={errors.aboutMd}
        onChange={(value) => change('aboutMd', value)}
        hint="Optional Markdown shown above the summary on the About page."
      />
      <NoticeLine notice={notice} />
      <div>
        <button type="submit" disabled={busy} className="button button--primary">
          Save profile
        </button>
      </div>
    </form>
  );
}

export default function ProfileEditor() {
  const profile = useApi('/api/admin/content/profile', Profile);
  if (profile.status === 'ready') return <ProfileForm saved={profile.data} />;
  return <LoadNotice status={profile.status} what="profile" back="/admin" />;
}
