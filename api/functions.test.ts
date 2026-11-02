import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const API_DIR = fileURLToPath(new URL('.', import.meta.url));
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const VERCEL_HOBBY_FUNCTION_LIMIT = 12;

const functionFiles = readdirSync(API_DIR, { recursive: true, encoding: 'utf8' })
  .map((file) => file.replaceAll('\\', '/'))
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.startsWith('_lib/'));

describe('Vercel functions', () => {
  it('stay within the Hobby plan function limit', () => {
    expect(functionFiles.length).toBeGreaterThan(0);
    expect(functionFiles.length).toBeLessThanOrEqual(VERCEL_HOBBY_FUNCTION_LIMIT);
  });

  it.each(functionFiles)('%s exports only HTTP method handlers', async (file) => {
    const exported: Record<string, unknown> = await import(`./${file}`);
    const names = Object.keys(exported);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      expect(METHODS).toContain(name);
      expect(typeof exported[name]).toBe('function');
    }
  });
});
