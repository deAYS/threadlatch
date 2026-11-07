import { expect, it } from 'vitest';
import { currentRevision } from '../../src/core/schema.js';
import { applyChanges } from '../../src/core/apply-changes.js';
import {
  addConversationRequest,
  applyProposals,
  importProposals,
} from '../../src/core/workflow.js';
import { parseTranscript, finalizeImport } from '../../src/import/parse-transcript.js';
import { proposeDiff } from '../../src/core/propose-diff.js';
import { scenario, proposal } from '../helpers.js';

it.each(['supersede', 'reject', 'resolve'] as const)(
  'exposes a supersede / %s pair without automatically choosing a winner',
  async (alternative) => {
    const { archive, request } = await scenario();
    const first = applyProposals(
      importProposals(archive, request.requestId, JSON.stringify(proposal(request))).archive,
      request.requestId,
      [request.proposalIds[0]],
    );
    const c = await finalizeImport(
      parseTranscript('User: Use PostgreSQL instead. Use MariaDB instead.', 'role-tagged'),
      first.project.id,
      first.project.currentRevisionId,
    );
    const prepared = addConversationRequest(first, c);
    const req = prepared.request;
    const batch = proposal(req);
    batch.changes = ['Use PostgreSQL.', 'Use MariaDB.'].map((text, index) => ({
      ...batch.changes[0],
      proposalId: req.proposalIds[index],
      operation: index === 0 ? 'supersede' : alternative,
      targetItemId: currentRevision(first).items[0].id,
      item: index === 0 || alternative === 'supersede' ? { ...batch.changes[0].item!, text } : null,
    }));
    const imported = importProposals(prepared.archive, req.requestId, JSON.stringify(batch));
    const current = currentRevision(imported.archive);
    const diff = proposeDiff(current, imported.result.batch);
    expect(diff.map((d) => d.selectable)).toEqual([true, true]);
    expect(diff.map((d) => 'autoSelectable' in d && d.autoSelectable)).toEqual([false, false]);
    expect(diff.map((d) => 'alternativeIds' in d && d.alternativeIds)).toEqual([
      [req.proposalIds[1]],
      [req.proposalIds[0]],
    ]);
    expect(() => applyChanges(current, imported.result.batch, req.proposalIds.slice(0, 2))).toThrow(
      /Conflicting changes/,
    );
    const next = applyChanges(current, imported.result.batch, [req.proposalIds[1]]);
    if (alternative === 'supersede') expect(next.items.at(-1)?.text).toBe('Use MariaDB.');
    else expect(next.items[0].status).toBe(alternative === 'reject' ? 'rejected' : 'resolved');
  },
);
