import { id, type MemoryItem, type Revision, type ProposalBatch } from './schema.js';
export function applyChanges(current: Revision, batch: ProposalBatch, selectedProposalIds: string[]): Revision {
  if (batch.baseRevisionId !== current.id) throw new Error('Stale revision. Reanalyze against current memory.');
  if (!selectedProposalIds.length || new Set(selectedProposalIds).size !== selectedProposalIds.length || selectedProposalIds.some(s => !batch.changes.some(c => c.proposalId === s))) throw new Error('Select valid, distinct proposal IDs.');
  const next: Revision = { ...structuredClone(current), id: id(), parentRevisionId: current.id, createdAt: new Date().toISOString(), actor: 'reviewed_ai' };
  const targets = new Set<string>();
  for (const c of batch.changes.filter(c => selectedProposalIds.includes(c.proposalId))) {
    const key = `${batch.requestId}:${c.proposalId}`;
    if (next.appliedProposalIds.includes(key)) throw new Error('Proposal already applied.');
    const target = next.items.find(i => i.id === c.targetItemId);
    if (c.operation !== 'add' && !target) throw new Error('Target missing.');
    if (c.operation !== 'conflict' && c.targetItemId) {
      if (targets.has(c.targetItemId)) throw new Error('Conflicting changes target the same item. Select one.');
      targets.add(c.targetItemId);
      if (target?.pinned || target?.origin === 'manual' && c.operation === 'supersede') throw new Error('Pinned or manually edited item requires manual review.');
      if (target?.status !== 'active' && target?.status !== 'proposed') throw new Error('Target is no longer current.');
    }
    if (c.operation === 'conflict') next.conflicts.push({ id: id(), targetItemIds: target ? [target.id] : [], evidence: c.evidence, note: c.note, resolved: false });
    else {
      if (target) target.status = c.operation === 'resolve' ? 'resolved' : c.operation === 'reject' ? 'rejected' : 'superseded';
      if (c.item) next.items.push({ ...c.item, id: id(), evidence: c.evidence, supersedesItemId: c.operation === 'supersede' ? c.targetItemId : null, pinned: false });
    }
    next.appliedProposalIds.push(key);
  }
  return next;
}
export function manualEdit(current: Revision, itemId: string, patch: { text?: string; pinned?: boolean; status?: MemoryItem['status'] }): Revision {
  const next = { ...structuredClone(current), id: id(), parentRevisionId: current.id, createdAt: new Date().toISOString(), actor: 'manual' as const };
  const item = next.items.find(i => i.id === itemId); if (!item) throw new Error('Unknown item.');
  if (patch.text !== undefined) { if (!patch.text.trim() || patch.text.length > 24_000) throw new Error('Invalid text size.'); item.text = patch.text; item.origin = 'manual'; }
  if (patch.pinned !== undefined) item.pinned = patch.pinned;
  if (patch.status !== undefined) { item.status = patch.status; item.origin = 'manual'; }
  return next;
}
export function restoreSnapshot(current: Revision, selected: Revision): Revision {
  if (current.projectId !== selected.projectId) throw new Error('Project mismatch.');
  return { ...structuredClone(selected), id: id(), parentRevisionId: current.id, createdAt: new Date().toISOString(), actor: 'restore', appliedProposalIds: [...new Set([...current.appliedProposalIds, ...selected.appliedProposalIds])] };
}
