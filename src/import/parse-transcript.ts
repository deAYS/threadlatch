import { id, type Conversation, type Message } from '../core/schema.js';
import { fingerprint } from './fingerprint.js';
export type ImportDraft = {
  raw: string;
  format: 'plain' | 'role-tagged';
  messages: Array<Pick<Message, 'role' | 'text'>>;
  warnings: string[];
};
export function parseTranscript(input: string, format: ImportDraft['format']): ImportDraft {
  if (!input.trim()) throw new Error('Empty source. Add a conversation excerpt.');
  if (new TextEncoder().encode(input).length > 1_048_576)
    throw new Error('Source size exceeds 1 MiB. Select a smaller section.');
  const draft: ImportDraft = { raw: input, format, messages: [], warnings: [] };
  if (format === 'plain') draft.messages.push({ role: 'unknown', text: input });
  else {
    let fence: string | null = null;
    for (const line of input.match(/[^\n]*\n|[^\n]+$/g) ?? []) {
      const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      const role =
        !fence && !marker ? line.match(/^(User|Assistant|Kullanıcı|Asistan):[ \t]?(.*)/i) : null;
      if (role) {
        const user = /^(user|kullanıcı)$/i.test(role[1]);
        draft.messages.push({
          role: user ? 'user' : 'assistant',
          text: line.slice(role[0].length - role[2].length),
        });
      } else if (draft.messages.length) draft.messages[draft.messages.length - 1].text += line;
      else draft.messages.push({ role: 'unknown', text: line });
      if (marker) {
        if (!fence) fence = marker[1];
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
      }
    }
    // Only a role-delimiting newline is removed; source-internal line endings remain intact.
    draft.messages = draft.messages
      .filter((m) => m.text.trim())
      .map((m, i, all) => ({
        ...m,
        text: i < all.length - 1 ? m.text.replace(/\r?\n$/, '') : m.text,
      }));
  }
  if (!draft.messages.length) throw new Error('No nonempty messages.');
  if (draft.messages.some((m) => m.role === 'unknown'))
    draft.warnings.push('Unknown roles stay unapproved. Assign roles in preview if known.');
  return draft;
}
export async function finalizeImport(
  draft: ImportDraft,
  projectId: string,
  baseRevisionId: string,
): Promise<Conversation> {
  const conversationId = id();
  return {
    id: conversationId,
    projectId,
    parentRevisionId: baseRevisionId,
    title: 'Conversation',
    importFingerprint: await fingerprint(projectId, baseRevisionId, draft.messages),
    messages: draft.messages.map((m, ordinal) => ({ ...m, id: id(), conversationId, ordinal })),
  };
}
