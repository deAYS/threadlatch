import {
  parseJson,
  ProposalBatchSchema,
  type AnalysisRequest,
  type ProposalBatch,
} from '../core/schema.js';
import { clearUserStatement, activeProvenanceAllowed } from '../core/provenance.js';
export type ValidationResult =
  | {
      ok: true;
      batch: ProposalBatch;
      matches: Array<{ messageId: string; quote: string; positions: number[] }>;
    }
  | { ok: false; errors: string[] };
export function validateProposalBatch(raw: string, request: AnalysisRequest): ValidationResult {
  try {
    let input = raw.trim();
    const fence = input.match(/^```(?:json)?\s*\n([\s\S]*?)\n```$/);
    if (fence) input = fence[1];
    const parsed = ProposalBatchSchema.safeParse(parseJson(input));
    if (!parsed.success)
      throw new Error(
        'Invalid proposal schema. Return one complete v1 batch with the requested fields.',
      );
    const batch = parsed.data,
      matches: Array<{ messageId: string; quote: string; positions: number[] }> = [];
    if (batch.requestId !== request.requestId || batch.baseRevisionId !== request.baseRevisionId)
      throw new Error('Request or revision mismatch. Prepare a new analysis.');
    if (new Set(batch.changes.map((c) => c.proposalId)).size !== batch.changes.length)
      throw new Error('Duplicate proposal identity.');
    for (const c of batch.changes) {
      if (!request.proposalIds.includes(c.proposalId))
        throw new Error('Unknown proposal identity. Use a supplied proposalId.');
      if (
        c.operation === 'add'
          ? c.targetItemId !== null || c.item === null
          : !request.currentItems.some((i) => i.id === c.targetItemId)
      )
        throw new Error('Unknown target or invalid operation.');
      if (c.operation === 'supersede' && !c.item) throw new Error('Replacement item required.');
      if (['reject', 'resolve'].includes(c.operation) && c.item)
        throw new Error('This operation requires item:null.');
      const sources = c.evidence.map((e) => {
        const m = request.selectedMessages.find((m) => m.id === e.messageId);
        if (!m || !m.text.includes(e.quote))
          throw new Error('Source quote or message reference not found.');
        const positions: number[] = [];
        let offset = 0;
        while ((offset = m.text.indexOf(e.quote, offset)) !== -1) {
          positions.push(offset);
          offset += 1;
        }
        matches.push({ ...e, positions });
        return m;
      });
      const clearUser = sources.length > 0 && sources.every((m) => clearUserStatement(m));
      const crossBranch = request.sourceRevisionIds.some((r) => r !== request.baseRevisionId);
      if (c.item?.origin === 'manual')
        throw new Error('Model output cannot claim manual provenance.');
      if (c.item) {
        if (!['active', 'proposed'].includes(c.item.status))
          throw new Error('New items must be active or proposed.');
        if (!activeProvenanceAllowed({ ...c.item, evidence: c.evidence }, sources)) {
          c.item.status = 'proposed';
          if (!clearUser)
            c.item.origin = sources.every((m) => m.role === 'assistant')
              ? 'assistant_suggestion'
              : 'inference';
        }
      }
      if (c.operation !== 'add' && c.operation !== 'conflict' && !clearUser) {
        c.operation = 'conflict';
        c.note = 'Unresolved: no clear user authority for this change. ' + c.note;
      }
      if (c.operation === 'supersede' && c.item?.status !== 'active') {
        c.operation = 'conflict';
        c.note =
          'Unresolved: an unapproved replacement cannot remove a current decision. ' + c.note;
      }
      if (c.operation === 'add' && c.item?.status === 'active' && crossBranch) {
        c.item.status = 'proposed';
        c.note = ('Unresolved: source belongs to another revision branch. ' + c.note).slice(
          0,
          4000,
        );
      }
      if (c.operation !== 'add' && c.operation !== 'conflict' && crossBranch) {
        c.operation = 'conflict';
        c.note = 'Unresolved: source belongs to another revision branch. ' + c.note;
      }
    }
    return { ok: true, batch, matches };
  } catch (e) {
    return { ok: false, errors: [e instanceof Error ? e.message : 'Invalid analysis.'] };
  }
}
