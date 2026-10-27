import { expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { scenario, proposal } from '../helpers.js';
import { validateProposalBatch } from '../../src/analysis/validate-proposals.js';
const fixtures = JSON.parse(
  await readFile(new URL('../fixtures/scenarios.json', import.meta.url), 'utf8'),
) as Array<{ id: string; source: string; expectedStatus: string }>;
it.each(fixtures)('guards synthetic source semantics: $id', async (fixture) => {
  const { request } = await scenario(fixture.source);
  const batch = proposal(request, 'Candidate interpretation');
  const result = validateProposalBatch(JSON.stringify(batch), request);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.batch.changes[0].item?.status).toBe(fixture.expectedStatus);
});
