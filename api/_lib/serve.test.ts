import type { Context } from './http';
import { serve } from './serve';

describe('serve', () => {
  beforeEach(() => {
    vi.stubEnv('DATABASE_URL', 'pglite://memory');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('builds a context from the environment and reuses one database per URL', async () => {
    const seen: Context[] = [];
    const handler = serve(async (_request, ctx) => {
      seen.push(ctx);
      return new Response('ok');
    });
    const res = await handler(new Request('http://localhost/x'));
    await handler(new Request('http://localhost/x'));
    expect(await res.text()).toBe('ok');
    expect(seen[0]?.db).toBe(seen[1]?.db);
    expect(seen[0]?.now()).toBeInstanceOf(Date);
  });

  it('maps errors like respond does', async () => {
    const res = await serve(() => Promise.reject(new Error('boom')))(new Request('http://localhost/x'));
    expect(res.status).toBe(500);
  });
});
