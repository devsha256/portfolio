import type { Db } from '../../db/client.js';
import { testDb } from '../../db/test-db.js';
import type { CredentialInput } from '../../src/domain/contracts.js';
import { ConflictError, InvalidError } from './errors.js';
import * as repo from './credentials-repo.js';

const base: CredentialInput = {
  kind: 'certification',
  name: 'MuleSoft Certified Developer - Level 1',
  authority: 'MuleSoft',
  issuedOn: '2020-12-05',
  image: '/img/certifications/mcd-l1.png',
  proof: 'https://drive.google.com/file/d/a/view',
};
const proof = (n: number) => `https://drive.google.com/file/d/${n}/view`;

let db: Db;
beforeEach(async () => {
  db = await testDb();
});

describe('credentials repo', () => {
  it('creates a credential and reads it back with nulls for the optional fields', async () => {
    const created = await repo.createCredential(db, base);
    expect(created).toEqual({ ...base, id: expect.any(Number), credentialId: null, link: null });
    expect(await repo.getCredential(db, created.id)).toEqual(created);
  });

  it('lists one kind, newest first', async () => {
    await repo.createCredential(db, { ...base, name: 'Old', issuedOn: '2019-01-01', proof: proof(1) });
    await repo.createCredential(db, { ...base, name: 'New', issuedOn: '2024-01-01', proof: proof(2) });
    await repo.createCredential(db, { ...base, kind: 'learning', name: 'Course', issuedOn: '2025-01-01', proof: proof(3) });
    expect((await repo.listByKind(db, 'certification')).map((c) => c.name)).toEqual(['New', 'Old']);
  });

  it('lists every kind for the admin, grouped by kind and newest first', async () => {
    await repo.createCredential(db, { ...base, kind: 'learning', name: 'Course', proof: proof(1) });
    await repo.createCredential(db, { ...base, name: 'Older cert', issuedOn: '2019-01-01', proof: proof(2) });
    await repo.createCredential(db, { ...base, name: 'Newer cert', issuedOn: '2023-01-01', proof: proof(3) });
    expect((await repo.listAllCredentials(db)).map((c) => c.name)).toEqual(['Newer cert', 'Older cert', 'Course']);
  });

  it('rejects the same certificate twice within a kind with ConflictError', async () => {
    await repo.createCredential(db, base);
    await expect(repo.createCredential(db, { ...base, name: 'Renamed' })).rejects.toBeInstanceOf(ConflictError);
  });

  it('turns an image outside /img into InvalidError if it slips past the contract', async () => {
    const created = await repo.createCredential(db, base);
    await expect(repo.updateCredential(db, created.id, { image: '/elsewhere.png' }, new Date())).rejects.toBeInstanceOf(InvalidError);
  });

  it('updates only the sent fields, can clear the link, and bumps updatedAt', async () => {
    const created = await repo.createCredential(db, { ...base, link: 'https://trailhead.salesforce.com/x' });
    const updated = await repo.updateCredential(db, created.id, { name: 'Renamed', link: null }, new Date());
    expect(updated).toEqual({ ...created, name: 'Renamed', link: null });
  });

  it('returns null when updating a missing credential', async () => {
    expect(await repo.updateCredential(db, 999, { name: 'x' }, new Date())).toBeNull();
  });

  it('deletes idempotently', async () => {
    const created = await repo.createCredential(db, base);
    await repo.deleteCredential(db, created.id);
    await expect(repo.deleteCredential(db, created.id)).resolves.toBeUndefined();
    expect(await repo.getCredential(db, created.id)).toBeNull();
  });
});
