import { expect, it } from 'vitest';
import { validateProposalBatch } from '../../src/analysis/validate-proposals.js';
import { scenario, proposal } from '../helpers.js';
it('accepts one JSON fence and reports every repeated quote location', async () => {
  const { request } = await scenario('User: SQLite. SQLite.');
  const b = proposal(request); b.changes[0].evidence[0].quote = 'SQLite.';
  const result = validateProposalBatch('```json\n' + JSON.stringify(b) + '\n```', request);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.matches[0].positions).toEqual([0, 8]);
});
it('rejects stale identity, forged references, extra fields, malformed and multiple objects', async () => {
  const { request } = await scenario();
  for (const field of ['requestId', 'baseRevisionId'] as const) {
    expect(validateProposalBatch(JSON.stringify({ ...proposal(request), [field]: 'wrong' }), request).ok).toBe(false);
  }
  const b = proposal(request); b.changes[0].evidence[0].quote = 'invented';
  expect(validateProposalBatch(JSON.stringify(b), request).ok).toBe(false);
  b.changes[0].evidence[0].quote = request.selectedMessages[0].text; b.changes[0].proposalId = 'invented';
  expect(validateProposalBatch(JSON.stringify(b), request).ok).toBe(false);
  for (const raw of ['', 'refused', '<script>alert(1)</script>', '{}{}', '{', '{"x":' + '['.repeat(50)]) expect(validateProposalBatch(raw, request).ok).toBe(false);
});
it.each(['Assistant: Use SQLite.', 'User: Example: use SQLite.', 'User: Örnek: SQLite kullan.', 'User: Tamam.', 'Unknown source'])('keeps unapproved or ambiguous statements proposed: %s', async text => {
  const { request } = await scenario(text);
  const r = validateProposalBatch(JSON.stringify(proposal(request)), request);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.batch.changes[0].item?.status).toBe('proposed');
});
