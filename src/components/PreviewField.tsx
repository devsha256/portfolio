import { lazy, Suspense, useState, type ReactNode } from 'react';
import { Field, inputClass } from './Field';

const Markdown = lazy(() => import('./Markdown'));
const asMarkdown = (value: string) => <Markdown>{value}</Markdown>;

type PreviewFieldProps = {
  id: string;
  label: string;
  value: string;
  error: string | undefined;
  onChange: (value: string) => void;
  hint?: string;
  rows?: number;
  /** How the public site renders this text; Markdown unless the field says otherwise. */
  preview?: (value: string) => ReactNode;
};

/** A textarea with a toggle that shows the text the way visitors will see it. */
export function PreviewField({ id, label, value, error, onChange, hint, rows = 8, preview = asMarkdown }: PreviewFieldProps) {
  const [previewing, setPreviewing] = useState(false);
  return (
    <div className="space-y-2">
      {previewing ? (
        <div className="space-y-1.5">
          <p className="font-medium">{label}</p>
          <Suspense fallback={<p className="text-muted">Loading preview…</p>}>
            <div className="rounded-md border border-line p-4">{preview(value)}</div>
          </Suspense>
        </div>
      ) : (
        <Field id={id} label={label} error={error} {...(hint && { hint })}>
          {(control) => (
            <textarea {...control} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass} font-mono text-sm`} />
          )}
        </Field>
      )}
      <button
        type="button"
        aria-pressed={previewing}
        aria-label={`Preview ${label.toLowerCase().replace(/ \(markdown\)$/, '')}`}
        onClick={() => setPreviewing(!previewing)}
        className="text-sm underline"
      >
        Preview
      </button>
    </div>
  );
}
