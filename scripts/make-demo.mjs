import { mkdirSync, writeFileSync } from 'node:fs';
import { createProject } from '../dist-cli/core/schema.js';
import { finalizeImport, parseTranscript } from '../dist-cli/import/parse-transcript.js';
import {
  addConversationRequest,
  importProposals,
  applyProposals,
} from '../dist-cli/core/workflow.js';
const a = createProject('Synthetic fieldnotes');
const c = await finalizeImport(
  parseTranscript(
    'User: Store project memory locally.\nAssistant: We could add cloud sync later.',
    'role-tagged',
  ),
  a.project.id,
  a.project.currentRevisionId,
);
const prepared = addConversationRequest(a, c),
  req = prepared.request;
const changes = [
  {
    kind: 'constraint',
    text: 'Store project memory locally.',
    status: 'active',
    origin: 'user_statement',
  },
  {
    kind: 'context',
    text: 'Cloud sync is an unaccepted suggestion.',
    status: 'proposed',
    origin: 'assistant_suggestion',
  },
].map((item, i) => ({
  proposalId: req.proposalIds[i],
  operation: 'add',
  targetItemId: null,
  item,
  evidence: [{ messageId: c.messages[i].id, quote: c.messages[i].text }],
  note: '',
}));
const imported = importProposals(
  prepared.archive,
  req.requestId,
  JSON.stringify({
    schemaVersion: 1,
    requestId: req.requestId,
    baseRevisionId: req.baseRevisionId,
    changes,
  }),
);
const result = applyProposals(imported.archive, req.requestId, req.proposalIds.slice(0, 2));
mkdirSync('public', { recursive: true });
writeFileSync('public/demo-project.json', JSON.stringify(result, null, 2) + '\n');
