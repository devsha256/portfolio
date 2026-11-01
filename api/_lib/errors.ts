import { z } from 'zod';

/** A write collided with a unique key (HTTP 409). */
export class ConflictError extends Error {
  override name = 'ConflictError';
}

/** A write broke a CHECK constraint the request could not be validated against up front (HTTP 400). */
export class InvalidError extends Error {
  override name = 'InvalidError';
}

const PgError = z.object({ code: z.string() });
const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';

/** Drizzle wraps driver errors in `cause`; both PGlite and Neon expose the SQLSTATE as `code`. */
function sqlState(error: unknown): string | null {
  const parsed = PgError.safeParse(error);
  if (parsed.success) return parsed.data.code;
  return error instanceof Error && error.cause !== undefined ? sqlState(error.cause) : null;
}

type Messages = { unique: string; check?: string };

/** Runs a write and turns constraint violations into domain errors carrying user-facing messages. */
export async function constrained<T>(write: () => Promise<T>, messages: Messages): Promise<T> {
  try {
    return await write();
  } catch (error) {
    const state = sqlState(error);
    if (state === UNIQUE_VIOLATION) throw new ConflictError(messages.unique, { cause: error });
    if (state === CHECK_VIOLATION && messages.check) throw new InvalidError(messages.check, { cause: error });
    throw error;
  }
}
