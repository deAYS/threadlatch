import { expect, it } from 'vitest';
import { cloneArchive } from '../../src/storage/archive.js';
import { parseArchive } from '../../src/core/schema.js';
import { scenario, proposal } from '../helpers.js';
import { finalizeImport, parseTranscript } from '../../src/import/parse-transcript.js';
it('remaps all identities on duplicate import while retaining pending sources and proposals', async () => {
  const { archive, request } = await scenario();
  archive.proposals.push(proposal(request));
  const clone = await cloneArchive(archive);
  expect(clone.project.id).not.toBe(archive.project.id);
  expect(clone.conversations[0].messages[0].text).toBe('Use SQLite.');
  expect(parseArchive(JSON.stringify(clone))).toEqual(clone);
  expect(clone.proposals[0].requestId).toBe(clone.requests[0].requestId);
  const repeated = await finalizeImport(
    parseTranscript('User: Use SQLite.', 'role-tagged'),
    clone.project.id,
    clone.conversations[0].parentRevisionId,
  );
  expect(repeated.importFingerprint).toBe(clone.conversations[0].importFingerprint);
});
