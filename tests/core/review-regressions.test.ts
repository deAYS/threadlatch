import { expect, it } from 'vitest';
import { scenario, proposal } from '../helpers.js';
import { validateProposalBatch } from '../../src/analysis/validate-proposals.js';
import { addConversationRequest, importProposals } from '../../src/core/workflow.js';
import { finalizeImport, parseTranscript } from '../../src/import/parse-transcript.js';
import { createAnalysisRequest } from '../../src/analysis/request.js';
import { currentRevision, parseArchive } from '../../src/core/schema.js';
it.each([
  'User: Örneğin SQLite kullanabiliriz.',
  'User: E.g. use SQLite.',
  'User: For example, use SQLite.',
  'User: What are the drawbacks?',
])('does not promote examples or questions: %s', async (source) => {
  const { request } = await scenario(source);
  const result = validateProposalBatch(JSON.stringify(proposal(request)), request);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.batch.changes[0].item?.status).toBe('proposed');
});
it('does not treat a user question as approval of an assistant suggestion', async () => {
  const { request } = await scenario('Assistant: Use SQLite.\nUser: What are the drawbacks?');
  const b = proposal(request);
  b.changes[0].evidence.push({
    messageId: request.selectedMessages[1].id,
    quote: request.selectedMessages[1].text,
  });
  const result = validateProposalBatch(JSON.stringify(b), request);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.batch.changes[0].item?.status).toBe('proposed');
});
it('can preserve a user question as an active open question without making it a decision', async () => {
  const { request } = await scenario('User: Which storage format should we choose?');
  const b = proposal(request, 'Which storage format should we choose?');
  b.changes[0].item!.kind = 'open_question';
  const r = validateProposalBatch(JSON.stringify(b), request);
  expect(r.ok).toBe(true);
  if (r.ok) expect(r.batch.changes[0].item?.status).toBe('active');
});
it('reuses a source for fresh analysis after a valid but unwanted batch without duplicating conversations', async () => {
  const { archive, request } = await scenario();
  const imported = importProposals(archive, request.requestId, JSON.stringify(proposal(request)));
  const repeated = await finalizeImport(
    parseTranscript('User: Use SQLite.', 'role-tagged'),
    archive.project.id,
    archive.project.currentRevisionId,
  );
  const retry = addConversationRequest(imported.archive, repeated);
  expect(retry.archive.conversations).toHaveLength(1);
  expect(retry.archive.requests).toHaveLength(2);
  expect(retry.request.requestId).not.toBe(request.requestId);
  expect(
    importProposals(retry.archive, retry.request.requestId, JSON.stringify(proposal(retry.request)))
      .archive.proposals,
  ).toHaveLength(2);
});
it('keeps inactive history out of the analysis budget and preserves it in the archive', async () => {
  const { archive } = await scenario();
  archive.requests = [];
  const revision = currentRevision(archive);
  revision.items = Array.from({ length: 100 }, (_, i) => ({
    id: 'item-' + i,
    text: 'Old synthetic context '.repeat(10),
    kind: 'context',
    status: i === 99 ? 'active' : 'superseded',
    origin: 'manual',
    evidence: [],
    supersedesItemId: null,
    pinned: false,
  }));
  const req = createAnalysisRequest(
    archive,
    archive.conversations[0].messages.map((m) => m.id),
  );
  expect(req.currentItems.map((i) => i.id)).toEqual(['item-99']);
  expect(currentRevision(archive).items).toHaveLength(100);
});
it('rejects forged active provenance in a backup while retaining visible manual corrections', async () => {
  const { archive, request } = await scenario('Assistant: We could use SQLite.');
  archive.requests = [];
  currentRevision(archive).items.push({
    id: 'forged',
    kind: 'decision',
    text: 'Use SQLite.',
    status: 'active',
    origin: 'user_statement',
    evidence: [
      { messageId: request.selectedMessages[0].id, quote: request.selectedMessages[0].text },
    ],
    supersedesItemId: null,
    pinned: false,
  });
  expect(() => parseArchive(JSON.stringify(archive))).toThrow(/provenance|authority/i);
  currentRevision(archive).items[0].origin = 'manual';
  expect(parseArchive(JSON.stringify(archive)).revisions[0].items[0].origin).toBe('manual');
});
it('supports an explicit narrow scope even when many current items are omitted', async () => {
  const { archive } = await scenario();
  archive.requests = [];
  currentRevision(archive).items = Array.from({ length: 1000 }, () => ({
    id: crypto.randomUUID(),
    text: 'Current synthetic context '.repeat(10),
    kind: 'context',
    status: 'active',
    origin: 'manual',
    evidence: [],
    supersedesItemId: null,
    pinned: false,
  }));
  const request = createAnalysisRequest(
    archive,
    archive.conversations[0].messages.map((m) => m.id),
    [],
  );
  expect(request.currentItems).toEqual([]);
  expect(request.omittedItemIds).toHaveLength(1000);
});
