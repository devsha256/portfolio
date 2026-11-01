import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  ADMIN_GITHUB_LOGIN: z.string().min(1),
  APP_URL: z.url().transform((url) => url.replace(/\/$/, '')),
});

export type Env = z.infer<typeof EnvSchema>;

export class EnvError extends Error {
  override name = 'EnvError';
}

/** Parses environment variables at the edge; call per request, never cache in module state. */
export function readEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = EnvSchema.safeParse(source);
  if (result.success) return result.data;
  const names = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
  throw new EnvError(`Invalid or missing environment variables: ${names}`);
}
