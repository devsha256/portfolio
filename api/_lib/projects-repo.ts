import { desc, eq, getTableColumns } from 'drizzle-orm';
import type { Db } from '../../db/client';
import { projects } from '../../db/schema';
import type { ProjectDto, ProjectInput, ProjectPatch } from '../../src/domain/contracts';
import { uniquely } from './errors';

const PERIOD_TAKEN = 'A project for this company already starts in that month';
const { createdAt: _c, updatedAt: _u, ...dtoColumns } = getTableColumns(projects);

export function listProjects(db: Db): Promise<ProjectDto[]> {
  return db.select(dtoColumns).from(projects).orderBy(desc(projects.startMonth), desc(projects.id));
}

export async function getProject(db: Db, id: number): Promise<ProjectDto | null> {
  const [row] = await db.select(dtoColumns).from(projects).where(eq(projects.id, id));
  return row ?? null;
}

export async function createProject(db: Db, input: ProjectInput): Promise<ProjectDto> {
  const [row] = await uniquely(() => db.insert(projects).values(input).returning(dtoColumns), PERIOD_TAKEN);
  if (!row) throw new Error('Insert returned no row');
  return row;
}

export async function updateProject(db: Db, id: number, patch: ProjectPatch): Promise<ProjectDto | null> {
  const [row] = await uniquely(
    () => db.update(projects).set({ ...patch, updatedAt: new Date() }).where(eq(projects.id, id)).returning(dtoColumns),
    PERIOD_TAKEN,
  );
  return row ?? null;
}

export async function deleteProject(db: Db, id: number): Promise<void> {
  await db.delete(projects).where(eq(projects.id, id));
}
