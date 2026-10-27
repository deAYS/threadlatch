import { currentRevision, id, type AnalysisRequest, type ProjectState } from '../core/schema.js';
import { buildAnalysisPrompt } from './prompt.js';
export function createAnalysisRequest(
  project: ProjectState,
  messageIds: string[],
  itemIds?: string[],
): AnalysisRequest {
  if (!messageIds.length || new Set(messageIds).size !== messageIds.length)
    throw new Error('Select source messages.');
  const all = project.conversations.flatMap((c) => c.messages);
  const selected = messageIds.map((mid) => {
    const m = all.find((m) => m.id === mid);
    if (!m) throw new Error('Unknown message reference.');
    return m;
  });
  const allItems = currentRevision(project).items,
    actionable = allItems.filter((i) => i.status === 'active' || i.status === 'proposed');
  if (
    itemIds &&
    (new Set(itemIds).size !== itemIds.length ||
      itemIds.some((mid) => !actionable.some((i) => i.id === mid)))
  )
    throw new Error('Unknown or duplicate memory scope. Select current item IDs.');
  const currentItems = actionable.filter((i) => !itemIds || itemIds.includes(i.id));
  const req: AnalysisRequest = {
    schemaVersion: 1,
    requestId: id(),
    projectId: project.project.id,
    baseRevisionId: project.project.currentRevisionId,
    sourceRevisionIds: [
      ...new Set(
        project.conversations
          .filter((c) => c.messages.some((m) => messageIds.includes(m.id)))
          .map((c) => c.parentRevisionId),
      ),
    ],
    selectedMessages: structuredClone(selected),
    currentItems: structuredClone(currentItems),
    omittedItemIds: actionable.filter((i) => !currentItems.includes(i)).map((i) => i.id),
    excludedHistoryCount: allItems.length - actionable.length,
    proposalIds: Array.from({ length: 32 }, id),
  };
  if (Array.from(buildAnalysisPrompt(req)).length > 24_000)
    throw new Error(
      'Analysis size exceeds 24,000 code points. Select fewer source messages or a narrower memory scope; nothing was truncated.',
    );
  return req;
}
