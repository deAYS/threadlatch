import { expect, it } from 'vitest';
import { scenario, proposal } from '../helpers.js';
import { validateProposalBatch } from '../../src/analysis/validate-proposals.js';
import { applyChanges } from '../../src/core/apply-changes.js';
import { currentRevision } from '../../src/core/schema.js';
import { parseTranscript, finalizeImport } from '../../src/import/parse-transcript.js';
import { createAnalysisRequest } from '../../src/analysis/request.js';
it('does not remove a current decision for an inferred replacement or an old branch', async () => {
  const { archive, request } = await scenario();
  const b = proposal(request);
  const revision = applyChanges(currentRevision(archive), b, [b.changes[0].proposalId]);
  archive.revisions.push(revision);
  archive.project.currentRevisionId = revision.id;
  archive.conversations.push(
    await finalizeImport(
      parseTranscript('User: Use PostgreSQL instead.', 'role-tagged'),
      archive.project.id,
      revision.id,
    ),
  );
  const req = createAnalysisRequest(
    archive,
    archive.conversations[1].messages.map((m) => m.id),
  );
  const replace = proposal(req, 'PostgreSQL');
  replace.changes[0].operation = 'supersede';
  replace.changes[0].targetItemId = revision.items[0].id;
  replace.changes[0].item!.origin = 'inference';
  const r = validateProposalBatch(JSON.stringify(replace), req);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.batch.changes[0].operation).toBe('conflict');
  replace.changes[0].item!.origin = 'user_statement';
  req.sourceRevisionIds = [request.baseRevisionId];
  const branch = validateProposalBatch(JSON.stringify(replace), req);
  expect(branch.ok).toBe(true);
  if (branch.ok) expect(branch.batch.changes[0].operation).toBe('conflict');
});
