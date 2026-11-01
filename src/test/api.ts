/** Stubs fetch for UI tests: the first route whose path prefix matches the request answers with its JSON. */
export function mockApi(routes: Record<string, unknown>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = new URL(String(input instanceof Request ? input.url : input), 'http://localhost');
    const path = url.pathname + url.search;
    const match = Object.keys(routes).find((prefix) => path.startsWith(prefix));
    return match ? Response.json(routes[match]) : Response.json({ error: 'Not found' }, { status: 404 });
  });
}
