import type { ReactNode } from 'react';

export type ControlProps = { id: string; 'aria-invalid': boolean; 'aria-describedby': string | undefined };

type FieldProps = {
  id: string;
  label: string;
  error?: string | undefined;
  hint?: string;
  children: (control: ControlProps) => ReactNode;
};

/** Label, control and message wired together so screen readers announce errors with the field. */
export function Field({ id, label, error, hint, children }: FieldProps) {
  const messageId = error || hint ? `${id}-message` : undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-medium">
        {label}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': messageId })}
      {messageId && (
        <p id={messageId} className={error ? 'text-sm font-medium text-red-700 dark:text-red-300' : 'text-sm text-muted'}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export const inputClass =
  'w-full rounded-md border border-line bg-panel px-3 py-2 aria-[invalid=true]:border-red-700 dark:aria-[invalid=true]:border-red-300';
