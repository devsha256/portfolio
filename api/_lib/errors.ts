import { z } from 'zod';

export class ConflictError extends Error {
  override name = 'ConflictError';
}

const PgError = z.object({ code: z.string() });
const UNIQUE_VIOLATION = '23505';

/** Drizzle wraps driver errors in `cause`; both PGlite and Neon expose the SQLSTATE as `code`. */
function isUniqueViolation(error: unknown): boolean {
  const parsed = PgError.safeParse(error);
  if (parsed.success) return parsed.data.code === UNIQUE_VIOLATION;
  return error instanceof Error && error.cause !== undefined && isUniqueViolation(error.cause);
}

/** Runs a write and turns a unique-key violation into a ConflictError carrying `message`. */
export async function uniquely<T>(write: () => Promise<T>, message: string): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (isUniqueViolation(error)) throw new ConflictError(message, { cause: error });
    throw error;
  }
}
