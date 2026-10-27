import { expect, it } from 'vitest';
import { currentRevision } from '../../src/core/schema.js';
import { applyChanges, manualEdit, restoreSnapshot } from '../../src/core/apply-changes.js';
import { validateProposalBatch } from '../../src/analysis/validate-proposals.js';
import { scenario, proposal } from '../helpers.js';
it('applies selected source-matched proposals atomically without mutating prior history', async () => {
  const { archive, request } = await scenario(); const current = currentRevision(archive), b = proposal(request);
  const validated = validateProposalBatch(JSON.stringify(b), request); if (!validated.ok) throw Error('fixture');
  const next = applyChanges(current, validated.batch, [b.changes[0].proposalId]);
  expect(next.items[0].text).toBe('Use SQLite.'); expect(current.items).toEqual([]);
  expect(() => applyChanges(next, b, [b.changes[0].proposalId])).toThrow(/revision|already/i);
  expect(() => applyChanges(current, b, [])).toThrow(/select/i);
  expect(() => applyChanges(current, b, ['missing'])).toThrow(/select/i);
});
it('preserves pinned/manual changes, cancels explicitly, and restores as a new revision', async () => {
  const { archive, request } = await scenario(); const b = proposal(request);
  const first = applyChanges(currentRevision(archive), b, [b.changes[0].proposalId]);
  const edit = manualEdit(first, first.items[0].id, { text: 'Use PostgreSQL.', pinned: true });
  expect(edit.items[0].origin).toBe('manual'); expect(edit.items[0].evidence).toEqual(first.items[0].evidence);
  const cancel = { ...b, baseRevisionId: edit.id, changes: [{ ...b.changes[0], proposalId: 'cancel', operation: 'reject' as const, targetItemId: edit.items[0].id, item: null }] };
  expect(() => applyChanges(edit, cancel, ['cancel'])).toThrow(/pinned|manual/i);
  const unpinned = manualEdit(first, first.items[0].id, { pinned: false });
  expect(applyChanges(unpinned, { ...cancel, baseRevisionId: unpinned.id }, ['cancel']).items[0].status).toBe('rejected');
  const restored = restoreSnapshot(edit, first);
  expect(restored.parentRevisionId).toBe(edit.id); expect(restored.id).not.toBe(first.id); expect(restored.items[0].text).toBe('Use SQLite.');
});
