import { type Revision, type ProposalBatch } from './schema.js';
export function proposeDiff(current: Revision, batch: ProposalBatch) {
  return batch.changes.map(change => {
    const before = current.items.find(i => i.id === change.targetItemId) ?? null;
    const blocked = batch.baseRevisionId !== current.id ? 'Stale revision' : before?.pinned || before?.origin === 'manual' && change.operation === 'supersede' ? 'Manual review required' : null;
    return { ...change, before, blocked, selectable: !blocked && change.operation !== 'conflict' };
  });
}
