import { renderHook, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { useApi } from './useApi';

const Thing = z.object({ name: z.string() });

function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(body, { status }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useApi', () => {
  it('returns validated data', async () => {
    mockFetch({ name: 'ok' });
    const { result } = renderHook(() => useApi('/api/thing', Thing));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', data: { name: 'ok' } }));
  });

  it('reports a response that breaks the contract as an error', async () => {
    mockFetch({ name: 42 });
    const { result } = renderHook(() => useApi('/api/thing', Thing));
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('reports 404 as not-found so pages can render their own empty state', async () => {
    mockFetch({ error: 'Post not found' }, 404);
    const { result } = renderHook(() => useApi('/api/thing', Thing));
    await waitFor(() => expect(result.current).toEqual({ status: 'not-found' }));
  });

  it('does not fetch when the path is null', () => {
    const spy = mockFetch({});
    const { result } = renderHook(() => useApi(null, Thing));
    expect(spy).not.toHaveBeenCalled();
    expect(result.current.status).toBe('loading');
  });
});

describe('useApi with a session cache', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('stores a successful response and serves the next mount from the cache', async () => {
    const spy = mockFetch({ name: 'ok' });
    const first = renderHook(() => useApi('/api/thing', Thing, { cacheKey: 'thing' }));
    await waitFor(() => expect(first.result.current.status).toBe('ready'));
    const second = renderHook(() => useApi('/api/thing', Thing, { cacheKey: 'thing' }));
    expect(second.result.current).toEqual({ status: 'ready', data: { name: 'ok' } });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('ignores a cached value that no longer matches the contract', async () => {
    sessionStorage.setItem('thing', JSON.stringify({ name: 7 }));
    const spy = mockFetch({ name: 'fresh' });
    const { result } = renderHook(() => useApi('/api/thing', Thing, { cacheKey: 'thing' }));
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', data: { name: 'fresh' } }));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('useApi auth states', () => {
  it('reports 401 as unauthorized so admin pages can offer sign-in', async () => {
    mockFetch({ error: 'Sign in required' }, 401);
    const { result } = renderHook(() => useApi('/api/auth/me', Thing));
    await waitFor(() => expect(result.current).toEqual({ status: 'unauthorized' }));
  });
});
