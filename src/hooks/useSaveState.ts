import { useState } from 'react';
import type { FieldErrors } from '../lib/admin-forms';
import type { Outcome } from '../lib/admin-client';

export type Notice = { kind: 'status' | 'alert'; text: string } | null;

/** Shared by the admin editors: field errors, one notice, and a busy flag around each request. */
export function useSaveState() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState(false);

  function invalid(fieldErrors: FieldErrors) {
    setErrors(fieldErrors);
    setNotice({ kind: 'alert', text: 'Fix the highlighted fields, then save again.' });
  }

  async function run<T>(request: Promise<Outcome<T>>, success: string): Promise<T | null> {
    setBusy(true);
    const outcome = await request.finally(() => setBusy(false));
    if (!outcome.ok) {
      setErrors(outcome.errors);
      setNotice({ kind: 'alert', text: outcome.message });
      return null;
    }
    setErrors({});
    setNotice({ kind: 'status', text: success });
    return outcome.data;
  }

  return { errors, notice, busy, invalid, run };
}
