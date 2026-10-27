import { z } from 'zod';
import { activeProvenanceAllowed } from './provenance.js';

export const id = () => crypto.randomUUID();
const Id = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[\w-]+$/);
const Text = z.string().min(1).max(1_048_576);
const list = <T extends z.ZodType>(type: T) => z.array(type).max(20_000);
export const EvidenceSchema = z.strictObject({ messageId: Id, quote: Text });
export const MessageSchema = z.strictObject({
  id: Id,
  conversationId: Id,
  ordinal: z.number().int().nonnegative(),
  role: z.enum(['user', 'assistant', 'unknown']),
  text: Text,
});
export const ConversationSchema = z.strictObject({
  id: Id,
  projectId: Id,
  title: z.string().max(300),
  parentRevisionId: Id,
  importFingerprint: Id,
  messages: list(MessageSchema),
});
export const ItemContentSchema = z.strictObject({
  kind: z.enum(['decision', 'constraint', 'assumption', 'open_question', 'context']),
  text: z.string().min(1).max(24_000),
  status: z.enum(['active', 'proposed', 'superseded', 'rejected', 'resolved']),
  origin: z.enum(['user_statement', 'assistant_suggestion', 'inference', 'manual']),
});
export const MemoryItemSchema = ItemContentSchema.extend({
  id: Id,
  evidence: list(EvidenceSchema),
  supersedesItemId: Id.nullable(),
  pinned: z.boolean(),
});
export const ConflictSchema = z.strictObject({
  id: Id,
  targetItemIds: list(Id),
  evidence: list(EvidenceSchema),
  note: z.string().max(4000),
  resolved: z.boolean(),
  reconciliation: z.string().min(1).max(2000).optional(),
});
export const RevisionSchema = z.strictObject({
  id: Id,
  parentRevisionId: Id.nullable(),
  projectId: Id,
  items: list(MemoryItemSchema),
  conflicts: list(ConflictSchema),
  appliedProposalIds: list(z.string().max(250)),
  createdAt: z.iso.datetime(),
  actor: z.enum(['reviewed_ai', 'manual', 'restore']),
});
export const AnalysisRequestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  requestId: Id,
  projectId: Id,
  baseRevisionId: Id,
  sourceRevisionIds: list(Id),
  selectedMessages: list(MessageSchema),
  currentItems: list(MemoryItemSchema),
  omittedItemIds: list(Id),
  excludedHistoryCount: z.number().int().nonnegative(),
  proposalIds: z.array(Id).min(1).max(64),
});
export const ProposedChangeSchema = z.strictObject({
  proposalId: Id,
  operation: z.enum(['add', 'supersede', 'resolve', 'reject', 'conflict']),
  targetItemId: Id.nullable(),
  item: ItemContentSchema.nullable(),
  evidence: z.array(EvidenceSchema).min(1).max(50),
  note: z.string().max(4000),
});
export const ProposalBatchSchema = z.strictObject({
  schemaVersion: z.literal(1),
  requestId: Id,
  baseRevisionId: Id,
  changes: z.array(ProposedChangeSchema).max(64),
});
export const ArchiveSchema = z.strictObject({
  schemaVersion: z.literal(1),
  project: z.strictObject({
    id: Id,
    title: z.string().min(1).max(300),
    currentRevisionId: Id,
    generation: z.number().int().nonnegative(),
  }),
  conversations: list(ConversationSchema),
  revisions: list(RevisionSchema),
  requests: list(AnalysisRequestSchema),
  proposals: list(ProposalBatchSchema),
});
export type Message = z.infer<typeof MessageSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type Evidence = z.infer<typeof EvidenceSchema>;
export type MemoryItem = z.infer<typeof MemoryItemSchema>;
export type Revision = z.infer<typeof RevisionSchema>;
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;
export type ProposedChange = z.infer<typeof ProposedChangeSchema>;
export type ProposalBatch = z.infer<typeof ProposalBatchSchema>;
export type ProjectArchive = z.infer<typeof ArchiveSchema>;
export type ProjectState = ProjectArchive;

export function parseJson(raw: string, maxBytes = 1_048_576): unknown {
  if (new TextEncoder().encode(raw).length > maxBytes)
    throw new Error('Input size limit exceeded. Select a smaller section.');
  let depth = 0,
    quoted = false,
    escaped = false;
  for (const char of raw) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '{' || char === '[') {
      if (++depth > 30) throw new Error('JSON depth limit exceeded.');
    } else if (char === '}' || char === ']') depth--;
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON. Paste one complete JSON object.');
  }
}

export function createProject(title: string): ProjectArchive {
  const projectId = id(),
    revisionId = id();
  return ArchiveSchema.parse({
    schemaVersion: 1,
    project: { id: projectId, title, currentRevisionId: revisionId, generation: 0 },
    conversations: [],
    requests: [],
    proposals: [],
    revisions: [
      {
        id: revisionId,
        parentRevisionId: null,
        projectId,
        items: [],
        conflicts: [],
        appliedProposalIds: [],
        createdAt: new Date().toISOString(),
        actor: 'manual',
      },
    ],
  });
}
export function currentRevision(archive: ProjectArchive): Revision {
  const revision = archive.revisions.find((r) => r.id === archive.project.currentRevisionId);
  if (!revision) throw new Error('Invalid revision reference.');
  return revision;
}
export function parseArchive(raw: string): ProjectArchive {
  const parsed = ArchiveSchema.safeParse(parseJson(raw, 10 * 1_048_576));
  if (!parsed.success) throw new Error('Invalid archive schema or unsupported schemaVersion.');
  const a = parsed.data;
  const check = (ok: unknown) => {
    if (!ok) throw new Error('Invalid archive reference or duplicate identity.');
  };
  const unique = (values: string[]) => new Set(values).size === values.length;
  check(unique(a.revisions.map((r) => r.id)));
  check(unique(a.conversations.map((c) => c.id)));
  check(unique(a.requests.map((r) => r.requestId)));
  check(unique(a.proposals.map((p) => p.requestId)));
  check(unique(a.conversations.map((c) => c.importFingerprint)));
  const revisions = new Map(a.revisions.map((r) => [r.id, r]));
  const messages = new Map(a.conversations.flatMap((c) => c.messages).map((m) => [m.id, m]));
  check(messages.size === a.conversations.reduce((n, c) => n + c.messages.length, 0));
  check(revisions.has(a.project.currentRevisionId));
  const evidence = (refs: Evidence[]) =>
    refs.forEach((e) => check(messages.get(e.messageId)?.text.includes(e.quote)));
  for (const c of a.conversations) {
    check(c.projectId === a.project.id && revisions.has(c.parentRevisionId));
    c.messages.forEach((m, i) => check(m.conversationId === c.id && m.ordinal === i));
  }
  for (const r of a.revisions) {
    check(
      r.projectId === a.project.id &&
        unique(r.items.map((i) => i.id)) &&
        unique(r.appliedProposalIds),
    );
    let ancestor: Revision | undefined = r;
    const seen = new Set<string>();
    while (ancestor) {
      check(!seen.has(ancestor.id));
      seen.add(ancestor.id);
      if (ancestor.parentRevisionId) check(revisions.has(ancestor.parentRevisionId));
      ancestor = ancestor.parentRevisionId ? revisions.get(ancestor.parentRevisionId) : undefined;
    }
    for (const item of r.items) {
      evidence(item.evidence);
      if (item.supersedesItemId) check(r.items.some((i) => i.id === item.supersedesItemId));
      if (item.status === 'active' && !activeProvenanceAllowed(item, [...messages.values()]))
        throw new Error('Invalid active provenance or user authority in archive.');
    }
    for (const conflict of r.conflicts) {
      evidence(conflict.evidence);
      conflict.targetItemIds.forEach((t) => check(r.items.some((i) => i.id === t)));
    }
  }
  for (const req of a.requests) {
    check(
      req.projectId === a.project.id &&
        revisions.has(req.baseRevisionId) &&
        unique(req.proposalIds),
    );
    check(
      JSON.stringify(req.sourceRevisionIds) ===
        JSON.stringify([
          ...new Set(
            a.conversations
              .filter((c) =>
                c.messages.some((m) => req.selectedMessages.some((s) => s.id === m.id)),
              )
              .map((c) => c.parentRevisionId),
          ),
        ]),
    );
    for (const m of req.selectedMessages)
      check(JSON.stringify(messages.get(m.id)) === JSON.stringify(m));
    const baseItems = revisions.get(req.baseRevisionId)!.items,
      actionable = baseItems.filter((i) => i.status === 'active' || i.status === 'proposed');
    check(unique(req.currentItems.map((i) => i.id)) && unique(req.omittedItemIds));
    check(req.excludedHistoryCount === baseItems.length - actionable.length);
    check(
      JSON.stringify(req.currentItems) ===
        JSON.stringify(actionable.filter((i) => !req.omittedItemIds.includes(i.id))),
    );
    check(req.omittedItemIds.every((mid) => actionable.some((i) => i.id === mid)));
  }
  for (const batch of a.proposals) {
    const req = a.requests.find((r) => r.requestId === batch.requestId);
    check(
      req &&
        req.baseRevisionId === batch.baseRevisionId &&
        unique(batch.changes.map((c) => c.proposalId)),
    );
    for (const change of batch.changes) {
      check(req?.proposalIds.includes(change.proposalId));
      evidence(change.evidence);
      change.evidence.forEach((e) =>
        check(req?.selectedMessages.some((m) => m.id === e.messageId)),
      );
      if (change.targetItemId) check(req?.currentItems.some((i) => i.id === change.targetItemId));
    }
  }
  return a;
}
export function serializeArchive(archive: ProjectArchive): string {
  const raw = JSON.stringify(archive);
  parseArchive(raw);
  // Leave room for the CLI's final newline; every emitted backup stays importable.
  if (new TextEncoder().encode(raw + '\n').length > 10 * 1_048_576)
    throw new Error('Archive size limit exceeded. Nothing was saved.');
  return raw;
}
