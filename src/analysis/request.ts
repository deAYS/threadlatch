import { currentRevision, id, type AnalysisRequest, type ProjectState } from '../core/schema.js';
export function createAnalysisRequest(project: ProjectState, messageIds: string[]): AnalysisRequest {
  if (!messageIds.length || new Set(messageIds).size !== messageIds.length) throw new Error('Select source messages.');
  const all = project.conversations.flatMap(c => c.messages);
  const selected = messageIds.map(mid => { const m = all.find(m => m.id === mid); if (!m) throw new Error('Unknown message reference.'); return m; });
  const req: AnalysisRequest = { schemaVersion: 1, requestId: id(), projectId: project.project.id, baseRevisionId: project.project.currentRevisionId, sourceRevisionIds: [...new Set(project.conversations.filter(c => c.messages.some(m => messageIds.includes(m.id))).map(c => c.parentRevisionId))], selectedMessages: structuredClone(selected), currentItems: structuredClone(currentRevision(project).items), proposalIds: Array.from({ length: 32 }, id) };
  if (Array.from(JSON.stringify(req)).length > 24_000) throw new Error('Analysis size exceeds 24,000 code points. Select fewer messages or a smaller section; nothing was truncated.');
  return req;
}
