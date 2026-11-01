import { EnvError, readEnv } from './env';

const valid = {
  DATABASE_URL: 'pglite://memory',
  GITHUB_CLIENT_ID: 'id',
  GITHUB_CLIENT_SECRET: 'secret',
  ADMIN_GITHUB_LOGIN: 'devsha256',
  APP_URL: 'http://localhost:5173',
};

describe('readEnv', () => {
  it('parses a complete environment', () => {
    expect(readEnv(valid)).toEqual({ ...valid, APP_URL: 'http://localhost:5173' });
  });

  it('names every missing variable', () => {
    const { ADMIN_GITHUB_LOGIN: _omit, ...rest } = valid;
    expect(() => readEnv(rest)).toThrow(EnvError);
    expect(() => readEnv(rest)).toThrow(/ADMIN_GITHUB_LOGIN/);
  });

  it('rejects an APP_URL that is not a URL', () => {
    expect(() => readEnv({ ...valid, APP_URL: 'localhost' })).toThrow(/APP_URL/);
  });

  it('strips a trailing slash from APP_URL', () => {
    expect(readEnv({ ...valid, APP_URL: 'https://x.dev/' }).APP_URL).toBe('https://x.dev');
  });
});
