import type { Db } from '../../db/client.js';
import { testDb } from '../../db/test-db.js';
import type { ProjectInput } from '../../src/domain/contracts.js';
import { ConflictError } from './errors.js';
import * as repo from './projects-repo.js';

const base: ProjectInput = {
  title: 'Migration',
  company: 'Accenture',
  startMonth: '2025-07-01',
  endMonth: null,
  description: 'd',
  skills: ['DataWeave'],
};

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

describe('projects repo', () => {
  it('lists projects newest start first', async () => {
    await repo.createProject(db, { ...base, company: 'TCS', startMonth: '2020-07-01', endMonth: '2021-08-01' });
    await repo.createProject(db, base);
    expect((await repo.listProjects(db)).map((p) => p.company)).toEqual(['Accenture', 'TCS']);
  });

  it('returns dates as YYYY-MM-DD strings and id as a number', async () => {
    const project = await repo.createProject(db, base);
    expect(project).toEqual({ ...base, id: expect.any(Number) });
  });

  it('rejects a second project for the same company and start month', async () => {
    await repo.createProject(db, base);
    await expect(repo.createProject(db, base)).rejects.toBeInstanceOf(ConflictError);
  });

  it('updates and returns the project, or null when missing', async () => {
    const project = await repo.createProject(db, base);
    expect(await repo.updateProject(db, project.id, { endMonth: '2025-09-01' }, new Date())).toMatchObject({
      endMonth: '2025-09-01',
    });
    expect(await repo.updateProject(db, 999, { title: 'x' }, new Date())).toBeNull();
  });

  it('deletes idempotently', async () => {
    const project = await repo.createProject(db, base);
    await repo.deleteProject(db, project.id);
    await expect(repo.deleteProject(db, project.id)).resolves.toBeUndefined();
    expect(await repo.getProject(db, project.id)).toBeNull();
  });
});
