import { useEffect, useState } from 'react';
import type { z } from 'zod';

export type ApiState<T> = { status: 'loading' } | { status: 'not-found' } | { status: 'error' } | { status: 'ready'; data: T };

/** Fetches JSON and validates it against the shared contract; `null` waits without fetching. */
export function useApi<T extends z.ZodType>(path: string | null, schema: T): ApiState<z.infer<T>> {
  const [state, setState] = useState<ApiState<z.infer<T>>>({ status: 'loading' });

  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetchJson(path, schema, controller.signal)
      .then(setState)
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [path, schema]);

  return state;
}

async function fetchJson<T extends z.ZodType>(path: string, schema: T, signal: AbortSignal): Promise<ApiState<z.infer<T>>> {
  const response = await fetch(path, { signal, credentials: 'same-origin' });
  if (response.status === 404) return { status: 'not-found' };
  if (!response.ok) return { status: 'error' };
  const parsed = schema.safeParse(await response.json());
  return parsed.success ? { status: 'ready', data: parsed.data } : { status: 'error' };
}
