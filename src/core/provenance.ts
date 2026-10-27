import { type Message, type MemoryItem } from './schema.js';
export function clearUserStatement(
  message: Pick<Message, 'role' | 'text'>,
  allowQuestion = false,
): boolean {
  const text = message.text.trim();
  return (
    message.role === 'user' &&
    !/\b(example|sample|for instance|hypothetical|assume|suppose)\b|\be\s*\.\s*g\s*\.|örne[kğ]|varsay|farz|diyelim/i.test(
      text,
    ) &&
    (allowQuestion ||
      !/[?？]|^(what|why|how|when|where|would|could|should|can we|hangi|neden|nasıl|acaba)\b/i.test(
        text,
      )) &&
    !/^(ok(?:ay)?|yes|sure|thanks?|sounds good|tamam|evet|olur|peki|teşekkürler)[.!\s]*$/i.test(
      text,
    )
  );
}
export function activeProvenanceAllowed(
  item: Pick<MemoryItem, 'origin' | 'kind' | 'evidence'>,
  messages: Message[],
): boolean {
  if (item.origin === 'manual') return true;
  return (
    item.origin === 'user_statement' &&
    item.kind !== 'assumption' &&
    item.evidence.length > 0 &&
    item.evidence.every((e) => {
      const m = messages.find((m) => m.id === e.messageId);
      return m && clearUserStatement(m, item.kind === 'open_question');
    })
  );
}
