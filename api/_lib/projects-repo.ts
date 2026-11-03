import { desc, eq, getTableColumns } from 'drizzle-orm';
import type { Db } from '../../db/client.js';
import { projects } from '../../db/schema.js';
import { PERIOD_ORDER_MESSAGE, type ProjectDto, type ProjectInput, type ProjectPatch } from '../../src/domain/contracts.js';
import { constrained } from './errors.js';

const PERIOD_RULES = {
  unique: 'A project for this company already starts in that month',
  check: PERIOD_ORDER_MESSAGE,
};
const { createdAt: _c, updatedAt: _u, ...dtoColumns } = getTableColumns(projects);

export function listProjects(db: Db): Promise<ProjectDto[]> {
  return db.select(dtoColumns).from(projects).orderBy(desc(projects.startMonth), desc(projects.id));
}

export async function getProject(db: Db, id: number): Promise<ProjectDto | null> {
  const [row] = await db.select(dtoColumns).from(projects).where(eq(projects.id, id));
  return row ?? null;
}

export async function createProject(db: Db, input: ProjectInput): Promise<ProjectDto> {
  const [row] = await constrained(() => db.insert(projects).values(input).returning(dtoColumns), PERIOD_RULES);
  if (!row) throw new Error('Insert returned no row');
  return row;
}

export async function updateProject(db: Db, id: number, patch: ProjectPatch, now: Date): Promise<ProjectDto | null> {
  const [row] = await constrained(
    () => db.update(projects).set({ ...patch, updatedAt: now }).where(eq(projects.id, id)).returning(dtoColumns),
    PERIOD_RULES,
  );
  return row ?? null;
}

export async function deleteProject(db: Db, id: number): Promise<void> {
  await db.delete(projects).where(eq(projects.id, id));
}
