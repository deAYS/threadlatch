import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { BrowserProjectRepository } from '../../src/storage/projects.js';
import { createProject, currentRevision } from '../../src/core/schema.js';
import { restoreSnapshot } from '../../src/core/apply-changes.js';
it('persists archives and rejects a stale writer within the same transaction', async () => {
  const repo = new BrowserProjectRepository('test-' + crypto.randomUUID());
  const a = createProject('Synthetic'); await repo.create(a);
  const next = structuredClone(a); const revision = restoreSnapshot(currentRevision(a), currentRevision(a));
  next.revisions.push(revision); next.project.currentRevisionId = revision.id;
  const results = await Promise.allSettled([repo.save(next, a.project.currentRevisionId), repo.save(next, a.project.currentRevisionId)]);
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  expect((await repo.load(a.project.id))?.project.currentRevisionId).toBe(revision.id);
  await repo.remove(a.project.id); expect(await repo.load(a.project.id)).toBeUndefined(); repo.db.close();
});
