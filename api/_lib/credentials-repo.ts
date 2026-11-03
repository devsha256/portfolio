import { asc, desc, eq, getTableColumns } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { credentials } from '../../db/schema.js';
import type { CredentialDto, CredentialInput, CredentialKind, CredentialPatch } from '../../src/domain/contracts.js';
import { constrained } from './errors.js';

const RULES = {
  unique: 'This certificate is already listed',
  check: 'Pick an image under /img',
};
const { createdAt: _c, updatedAt: _u, ...dtoColumns } = getTableColumns(credentials);
const newestFirst = [desc(credentials.issuedOn), desc(credentials.id)];

export function listByKind(db: Db, kind: CredentialKind): Promise<CredentialDto[]> {
  return db.select(dtoColumns).from(credentials).where(eq(credentials.kind, kind)).orderBy(...newestFirst);
}

/** Admin view: kinds sorted by name (certification, feedback, learning, which is also the tab order), newest first within each. */
export function listAllCredentials(db: Db): Promise<CredentialDto[]> {
  return db.select(dtoColumns).from(credentials).orderBy(asc(credentials.kind), ...newestFirst);
}

export async function getCredential(db: Db, id: number): Promise<CredentialDto | null> {
  const [row] = await db.select(dtoColumns).from(credentials).where(eq(credentials.id, id));
  return row ?? null;
}

export async function createCredential(db: Db, input: CredentialInput): Promise<CredentialDto> {
  const [row] = await constrained(() => db.insert(credentials).values(input).returning(dtoColumns), RULES);
  if (!row) throw new Error('Insert returned no row');
  return row;
}

export async function updateCredential(db: Db, id: number, patch: CredentialPatch, now: Date): Promise<CredentialDto | null> {
  const [row] = await constrained(
    () => db.update(credentials).set({ ...patch, updatedAt: now }).where(eq(credentials.id, id)).returning(dtoColumns),
    RULES,
  );
  return row ?? null;
}

export async function deleteCredential(db: Db, id: number): Promise<void> {
  await db.delete(credentials).where(eq(credentials.id, id));
}
