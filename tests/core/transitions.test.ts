import { expect, it } from 'vitest';
import { scenario } from '../helpers.js';
import { assertTransition } from '../../src/core/workflow.js';
import { currentRevision } from '../../src/core/schema.js';
import { createAnalysisRequest } from '../../src/analysis/request.js';
import { buildAnalysisPrompt } from '../../src/analysis/prompt.js';
it('rejects rewriting an immutable source or old revision', async () => {
  const { archive } = await scenario();
  const rewritten = structuredClone(archive);
  rewritten.conversations[0].messages[0].text = 'replacement';
  expect(() => assertTransition(archive, rewritten)).toThrow(/Immutable/i);
  const overwritten = structuredClone(archive);
  currentRevision(overwritten).actor = 'reviewed_ai';
  expect(() => assertTransition(archive, overwritten)).toThrow(/Immutable/i);
});
it('rejects analysis when the whole outgoing prompt exceeds the code-point budget', async () => {
  const { archive } = await scenario();
  archive.conversations[0].messages[0].text = 'x'.repeat(20_000);
  expect(() =>
    createAnalysisRequest(
      archive,
      archive.conversations[0].messages.map((m) => m.id),
    ),
  ).toThrow(/size|24,000/i);
  const small = await scenario();
  expect(Array.from(buildAnalysisPrompt(small.request)).length).toBeLessThanOrEqual(24_000);
});
