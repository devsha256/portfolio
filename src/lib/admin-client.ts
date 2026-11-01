import { z } from 'zod';
import type { FieldErrors } from './admin-forms';

export type Outcome<T> = { ok: true; data: T } | { ok: false; message: string; errors: FieldErrors };
type Failure = Extract<Outcome<never>, { ok: false }>;

const ErrorBody = z.object({
  error: z.string(),
  issues: z.object({ fieldErrors: z.record(z.string(), z.array(z.string())) }).optional(),
});

async function failure(response: Response): Promise<Failure> {
  const parsed = ErrorBody.safeParse(await response.json().catch(() => null));
  if (!parsed.success) return { ok: false, message: `The server answered ${response.status}. Try again.`, errors: {} };
  const entries = Object.entries(parsed.data.issues?.fieldErrors ?? {});
  const errors = Object.fromEntries(entries.flatMap(([field, messages]) => (messages[0] ? [[field, messages[0]]] : [])));
  return { ok: false, message: parsed.data.error, errors };
}

/** Admin writes. The browser adds the Origin header the server checks; the session cookie rides along. */
export async function sendJson<T extends z.ZodType>(
  method: 'POST' | 'PATCH',
  path: string,
  body: unknown,
  schema: T,
): Promise<Outcome<z.infer<T>>> {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) return failure(response);
  const parsed = schema.safeParse(await response.json());
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, message: 'The server sent an unexpected answer.', errors: {} };
}

export async function deleteAt(path: string): Promise<Outcome<true>> {
  const response = await fetch(path, { method: 'DELETE', credentials: 'same-origin' });
  return response.ok ? { ok: true, data: true } : failure(response);
}

export async function signOut(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
}
