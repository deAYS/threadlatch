import { expect, it } from 'vitest';
import { currentRevision, parseArchive } from '../../src/core/schema.js';
import { finalizeImport, parseTranscript } from '../../src/import/parse-transcript.js';
import {
  addConversationRequest,
  importProposals,
  applyProposals,
} from '../../src/core/workflow.js';
import { proposal, scenario } from '../helpers.js';

it.each(['decision', 'context'] as const)(
  'keeps a new %s from a different revision proposed when the model labels it active',
  async (kind) => {
    const initial = await scenario('User: Use SQLite.');
    const seeded = importProposals(
      initial.archive,
      initial.request.requestId,
      JSON.stringify(proposal(initial.request)),
    );
    const archive = applyProposals(seeded.archive, initial.request.requestId, [
      initial.request.proposalIds[0],
    ]);
    const before = JSON.stringify(archive);
    const conversation = await finalizeImport(
      parseTranscript('User: This separate branch uses PostgreSQL.', 'role-tagged'),
      archive.project.id,
      initial.request.baseRevisionId,
    );
    const prepared = addConversationRequest(archive, conversation);
    const batch = proposal(prepared.request, 'This separate branch uses PostgreSQL.');
    batch.changes[0].item!.kind = kind;
    batch.changes[0].note = 'n'.repeat(4000);
    const imported = importProposals(
      prepared.archive,
      prepared.request.requestId,
      JSON.stringify(batch),
    );
    const saved = applyProposals(imported.archive, prepared.request.requestId, [
      prepared.request.proposalIds[0],
    ]);
    const items = currentRevision(saved).items;
    expect(items.filter((item) => item.status === 'active').map((item) => item.text)).toEqual([
      'Use SQLite.',
    ]);
    expect(items.find((item) => item.text.includes('PostgreSQL'))).toMatchObject({
      kind,
      status: 'proposed',
      evidence: batch.changes[0].evidence,
    });
    expect(imported.result.ok && imported.result.batch.changes[0].note).toMatch(/branch/i);
    expect(() => parseArchive(JSON.stringify(saved))).not.toThrow();
    expect(JSON.stringify(archive)).toBe(before);
  },
);

it.each(['decision', 'context'] as const)(
  'allows a clear new %s on the current revision to stay active',
  async (kind) => {
    const { archive, request } = await scenario('User: Use PostgreSQL.');
    const batch = proposal(request, 'Use PostgreSQL.');
    batch.changes[0].item!.kind = kind;
    const imported = importProposals(archive, request.requestId, JSON.stringify(batch));
    const saved = applyProposals(imported.archive, request.requestId, [request.proposalIds[0]]);
    expect(currentRevision(saved).items).toMatchObject([
      { text: 'Use PostgreSQL.', kind, status: 'active' },
    ]);
  },
);
