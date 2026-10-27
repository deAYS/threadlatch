import { expect, it } from 'vitest';
import { buildHandoff } from '../../src/export/handoff.js';
import { createProject, currentRevision } from '../../src/core/schema.js';
import { applyChanges } from '../../src/core/apply-changes.js';
import { scenario, proposal } from '../helpers.js';
it('exports only current items and escapes HTML and Markdown reference data', async () => {
  const { archive, request } = await scenario('User: <img src="https://invalid/image"> Türkçe 😀');
  const b = proposal(request, '<img src="https://invalid/image"> Türkçe 😀');
  const rev = applyChanges(currentRevision(archive), b, [b.changes[0].proposalId]);
  const result = buildHandoff(rev, { maxCodePoints: 8000, includeEvidence: true });
  expect(result.ok).toBe(true);
  if (result.ok) { expect(result.text).toContain('Türkçe 😀'); expect(result.text).not.toContain('<img'); expect(result.text).toContain('Reference data'); }
  rev.items[0].status = 'rejected';
  expect(buildHandoff(rev, { maxCodePoints: 8000, includeEvidence: false })).toMatchObject({ ok: true, includedItemIds: [] });
});
it('stops when mandatory decisions exceed budget and reports optional omissions', () => {
  const r = currentRevision(createProject('Synthetic'));
  r.items.push({ id: 'i', text: '😀'.repeat(8100), kind: 'decision', status: 'active', origin: 'manual', pinned: false, evidence: [], supersedesItemId: null });
  expect(buildHandoff(r, { maxCodePoints: 8000, includeEvidence: false }).ok).toBe(false);
  r.items[0].kind = 'context';
  expect(buildHandoff(r, { maxCodePoints: 8000, includeEvidence: false })).toMatchObject({ ok: true, omittedItemIds: ['i'] });
});
