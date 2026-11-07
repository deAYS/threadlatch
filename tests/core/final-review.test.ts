import { expect, it } from 'vitest';
import { createProject, currentRevision, ConflictSchema } from '../../src/core/schema.js';
import { proposeDiff } from '../../src/core/propose-diff.js';
import { resolveConflict } from '../../src/core/apply-changes.js';
import { scenario, proposal } from '../helpers.js';
import { createOperationQueue } from '../../src/ui/operation-queue.js';
it('allows explicitly recording a conflict for a pinned item without selecting it as a safe mutation', async () => {
  const { archive, request } = await scenario();
  const r = currentRevision(archive);
  r.items.push({
    id: 'pinned',
    kind: 'decision',
    text: 'Keep SQLite.',
    status: 'active',
    origin: 'manual',
    evidence: [],
    supersedesItemId: null,
    pinned: true,
  });
  const b = proposal(request);
  b.changes[0].operation = 'conflict';
  b.changes[0].targetItemId = 'pinned';
  b.changes[0].item = null;
  expect(proposeDiff(r, b)[0]).toMatchObject({ blocked: null, selectable: false });
});
it('reconciles a maximum-length conflict while preserving its original note', () => {
  const r = currentRevision(createProject('Synthetic'));
  const note = 'x'.repeat(4000);
  r.conflicts.push({ id: 'conflict', targetItemIds: [], evidence: [], note, resolved: false });
  const next = resolveConflict(r, 'conflict', 'Keep SQLite.');
  expect(ConflictSchema.safeParse(next.conflicts[0]).success).toBe(true);
  expect(next.conflicts[0].note).toBe(note);
});
it('serializes deletion and immediate import, and continues after a failed mutation', async () => {
  const enqueue = createOperationQueue(),
    events: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const deletion = enqueue(async () => {
    events.push('delete');
    await gate;
    events.push('deleted');
  });
  const restore = enqueue(async () => {
    events.push('restore');
  });
  await Promise.resolve();
  expect(events).toEqual(['delete']);
  release();
  await Promise.all([deletion, restore]);
  expect(events).toEqual(['delete', 'deleted', 'restore']);
  await expect(
    enqueue(async () => {
      throw Error('Synthetic quota failure');
    }),
  ).rejects.toThrow();
  await enqueue(async () => {
    events.push('continued');
  });
  expect(events.at(-1)).toBe('continued');
});
