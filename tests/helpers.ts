import { createProject, type AnalysisRequest, type ProposalBatch } from '../src/core/schema.js';
import { parseTranscript, finalizeImport } from '../src/import/parse-transcript.js';
import { createAnalysisRequest } from '../src/analysis/request.js';
export async function scenario(text = 'User: Use SQLite.') {
  const archive = createProject('Synthetic');
  archive.conversations.push(
    await finalizeImport(
      parseTranscript(text, 'role-tagged'),
      archive.project.id,
      archive.project.currentRevisionId,
    ),
  );
  const request = createAnalysisRequest(
    archive,
    archive.conversations.flatMap((c) => c.messages.map((m) => m.id)),
  );
  archive.requests.push(request);
  return { archive, request };
}
export function proposal(request: AnalysisRequest, text = 'Use SQLite.'): ProposalBatch {
  return {
    schemaVersion: 1,
    requestId: request.requestId,
    baseRevisionId: request.baseRevisionId,
    changes: [
      {
        proposalId: request.proposalIds[0],
        operation: 'add',
        targetItemId: null,
        item: { kind: 'decision', text, status: 'active', origin: 'user_statement' },
        evidence: [
          { messageId: request.selectedMessages[0].id, quote: request.selectedMessages[0].text },
        ],
        note: '',
      },
    ],
  };
}
