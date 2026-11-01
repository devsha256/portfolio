import { useEffect, useState } from 'react';
import type { z } from 'zod';

export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'not-found' }
  | { status: 'unauthorized' }
  | { status: 'error' }
  | { status: 'ready'; data: T };

type Options = {
  /** Keep a successful response in sessionStorage under this key (used for the rate-limited GitHub API). */
  cacheKey?: string;
};

const LOADING = { status: 'loading' } as const;

/** Fetches JSON and validates it against the shared contract; `null` waits without fetching. */
export function useApi<T extends z.ZodType>(path: string | null, schema: T, { cacheKey }: Options = {}): ApiState<z.infer<T>> {
  const [state, setState] = useState<ApiState<z.infer<T>>>(() => fromCache(cacheKey, schema) ?? LOADING);

  useEffect(() => {
    if (path === null) return;
    const cached = fromCache(cacheKey, schema);
    if (cached) return setState(cached);
    const controller = new AbortController();
    setState(LOADING);
    fetchJson(path, schema, controller.signal)
      .then((next) => {
        if (next.status === 'ready' && cacheKey) sessionStorage.setItem(cacheKey, JSON.stringify(next.data));
        setState(next);
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });
    return () => controller.abort();
  }, [path, schema, cacheKey]);

  return state;
}

function fromCache<T extends z.ZodType>(cacheKey: string | undefined, schema: T): ApiState<z.infer<T>> | null {
  const raw = cacheKey ? sessionStorage.getItem(cacheKey) : null;
  if (!raw) return null;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? { status: 'ready', data: parsed.data } : null;
  } catch {
    return null;
  }
}

async function fetchJson<T extends z.ZodType>(path: string, schema: T, signal: AbortSignal): Promise<ApiState<z.infer<T>>> {
  const response = await fetch(path, { signal, credentials: 'same-origin' });
  if (response.status === 404) return { status: 'not-found' };
  if (response.status === 401) return { status: 'unauthorized' };
  if (!response.ok) return { status: 'error' };
  const parsed = schema.safeParse(await response.json());
  return parsed.success ? { status: 'ready', data: parsed.data } : { status: 'error' };
}
