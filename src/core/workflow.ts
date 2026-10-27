import { parseArchive, currentRevision, type ProjectArchive, type Conversation, type Revision } from './schema.js';
import { createAnalysisRequest } from '../analysis/request.js';
import { validateProposalBatch } from '../analysis/validate-proposals.js';
import { applyChanges } from './apply-changes.js';

export function addConversationRequest(archive: ProjectArchive, conversation: Conversation, selectedMessageIds = conversation.messages.map(m => m.id)) {
  if (archive.conversations.some(c => c.importFingerprint === conversation.importFingerprint)) throw new Error('Duplicate import. Use the existing source or select a different base revision.');
  const next = structuredClone(archive); next.conversations.push(conversation);
  const request = createAnalysisRequest(next, selectedMessageIds); next.requests.push(request);
  return { archive: next, request };
}
export function importProposals(archive: ProjectArchive, requestId: string, raw: string) {
  const req = archive.requests.find(r => r.requestId === requestId); if (!req) throw new Error('Unknown request.');
  if (archive.project.currentRevisionId !== req.baseRevisionId) throw new Error('Stale revision. Prepare a new analysis.');
  if (archive.proposals.some(b => b.requestId === requestId)) throw new Error('This request already has a proposal. Prepare a new request to reanalyze.');
  const result = validateProposalBatch(raw, req); if (!result.ok) throw new Error(result.errors.join(' '));
  const next = structuredClone(archive); next.proposals.push(result.batch); return { archive: next, result };
}
export function applyProposals(archive: ProjectArchive, requestId: string, selected: string[]) {
  const req = archive.requests.find(r => r.requestId === requestId), batch = archive.proposals.find(b => b.requestId === requestId);
  if (!req || !batch) throw new Error('Import a valid proposal first.');
  const validated = validateProposalBatch(JSON.stringify(batch), req); if (!validated.ok) throw new Error(validated.errors.join(' '));
  return appendRevision(archive, applyChanges(currentRevision(archive), validated.batch, selected));
}
export function appendRevision(archive: ProjectArchive, revision: Revision) {
  const next = structuredClone(archive); next.revisions.push(revision); next.project.currentRevisionId = revision.id; return next;
}
export function assertTransition(before: ProjectArchive, after: ProjectArchive) {
  if (before.project.id !== after.project.id) throw new Error('Project identity mismatch. Import as a separate project.');
  for (const key of ['conversations', 'revisions', 'requests', 'proposals'] as const) {
    if (before[key].some((value, index) => JSON.stringify(value) !== JSON.stringify(after[key][index]))) throw new Error('Immutable history cannot be overwritten. Import as a separate project.');
  }
  parseArchive(JSON.stringify(after));
}
