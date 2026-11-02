/** Stubs fetch for UI tests: the first route whose path prefix matches the request answers with its JSON. */
export function mockApi(routes: Record<string, unknown>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input instanceof Request ? input.url : input), 'http://localhost');
    const path = url.pathname + url.search;
    const match = Object.keys(routes).find((prefix) => path.startsWith(prefix) || url.href.startsWith(prefix));
    return match ? Response.json(routes[match]) : Response.json({ error: 'Not found' }, { status: 404 });
  });
}

type Write = { method: string; url: string; body: unknown };

/**
 * For admin tests: serves GETs from `reads` (exact URL, 404 otherwise), records every write,
 * and answers writes with `reply`, which receives the parsed request body.
 */
export function stubApi(reads: Record<string, unknown>, reply: (body: unknown) => Response = () => Response.json({})) {
  const writes: Write[] = [];
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    if (method === 'GET') return url in reads ? Response.json(reads[url]) : Response.json({}, { status: 404 });
    const body: unknown = init?.body ? JSON.parse(String(init.body)) : undefined;
    writes.push({ method, url, body });
    return reply(body);
  });
  return writes;
}
