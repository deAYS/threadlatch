import { id, parseArchive, type ProjectArchive } from '../core/schema.js';
import { fingerprint } from '../import/fingerprint.js';
export async function cloneArchive(archive: ProjectArchive): Promise<ProjectArchive> {
  const a = structuredClone(archive),
    mapping = new Map<string, string>();
  const add = (value: string) => {
    if (!mapping.has(value)) mapping.set(value, id());
  };
  add(a.project.id);
  for (const c of a.conversations) {
    add(c.id);
    c.messages.forEach((m) => add(m.id));
  }
  for (const r of a.revisions) {
    add(r.id);
    r.items.forEach((i) => add(i.id));
    r.conflicts.forEach((c) => add(c.id));
  }
  for (const r of a.requests) {
    add(r.requestId);
    r.proposalIds.forEach(add);
  }
  // Remap identity fields only. User text may contain strings identical to IDs.
  const keys = new Set([
    'id',
    'projectId',
    'conversationId',
    'messageId',
    'parentRevisionId',
    'currentRevisionId',
    'baseRevisionId',
    'requestId',
    'proposalId',
    'targetItemId',
    'supersedesItemId',
  ]);
  const arrays = new Set(['proposalIds', 'sourceRevisionIds', 'targetItemIds', 'omittedItemIds']);
  function walk(value: unknown, key = ''): unknown {
    if (typeof value === 'string') {
      if (key === 'appliedProposalIds')
        return value
          .split(':')
          .map((v) => mapping.get(v) ?? v)
          .join(':');
      return keys.has(key) || arrays.has(key) ? (mapping.get(value) ?? value) : value;
    }
    if (Array.isArray(value)) return value.map((v) => walk(v, key));
    if (value && typeof value === 'object')
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v, k)]));
    return value;
  }
  const clone = parseArchive(JSON.stringify(walk(a)));
  for (const c of clone.conversations)
    c.importFingerprint = await fingerprint(clone.project.id, c.parentRevisionId, c.messages);
  return clone;
}
