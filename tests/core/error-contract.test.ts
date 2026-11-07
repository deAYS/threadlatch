import { expect, it } from 'vitest';
import { parseJson } from '../../src/core/schema.js';
import { parseTranscript } from '../../src/import/parse-transcript.js';
import { importProposals } from '../../src/core/workflow.js';
import { scenario } from '../helpers.js';

it('keeps stable error codes through JSON parsing and analysis import', async () => {
  const { archive, request } = await scenario();
  for (const operation of [
    () => parseJson('{broken'),
    () => importProposals(archive, request.requestId, '{broken'),
  ]) {
    expect(operation).toThrow(expect.objectContaining({ code: 'invalid_json' }));
  }
  expect(() => parseTranscript('x'.repeat(1_048_577), 'plain')).toThrow(
    expect.objectContaining({ code: 'source_size' }),
  );
  const stale = structuredClone(archive);
  stale.project.currentRevisionId = 'other-revision';
  expect(() => importProposals(stale, request.requestId, '{}')).toThrow(
    expect.objectContaining({ code: 'stale_revision' }),
  );
});
