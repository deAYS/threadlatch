import { type Revision, type ProposalBatch } from './schema.js';
export function proposeDiff(current: Revision, batch: ProposalBatch) {
  return batch.changes.map((change) => {
    const before = current.items.find((i) => i.id === change.targetItemId) ?? null;
    const blocked =
      batch.baseRevisionId !== current.id
        ? 'Stale revision'
        : change.operation !== 'conflict' &&
            (before?.pinned || (before?.origin === 'manual' && change.operation === 'supersede'))
          ? 'Manual review required'
          : null;
    const alternativeIds =
      change.targetItemId && change.operation !== 'conflict'
        ? batch.changes
            .filter(
              (other) =>
                other.proposalId !== change.proposalId &&
                other.operation !== 'conflict' &&
                other.targetItemId === change.targetItemId,
            )
            .map((other) => other.proposalId)
        : [];
    const selectable = !blocked && change.operation !== 'conflict';
    const blockedCode: 'requestStale' | 'manualReview' | null =
      batch.baseRevisionId !== current.id ? 'requestStale' : blocked ? 'manualReview' : null;
    return {
      ...change,
      before,
      blocked,
      blockedCode,
      selectable,
      alternativeIds,
      autoSelectable: selectable && alternativeIds.length === 0,
    };
  });
}
